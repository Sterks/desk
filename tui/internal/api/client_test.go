package api

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

func reply(w http.ResponseWriter, status int, body any) {
	w.Header().Set("content-type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func ok(data any) map[string]any { return map[string]any{"ok": true, "data": data} }

func TestBoardDecodesColumnsAndFields(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/board" || r.Method != http.MethodGet {
			t.Errorf("unexpected request %s %s", r.Method, r.URL.Path)
		}
		reply(w, 200, ok(map[string]any{
			"name":  "desk",
			"guide": nil,
			"columns": []any{
				map[string]any{"id": "backlog", "title": "Backlog", "guide": nil, "wip_limit": nil, "count": 2},
				map[string]any{"id": "in_progress", "title": "In progress", "guide": "g", "wip_limit": 3, "count": 1},
			},
			"fields": []any{
				map[string]any{"id": "priority", "type": "enum", "required": true, "values": []string{"p0", "p1"}, "default": "p1"},
			},
			"transitions": nil,
		}))
	}))
	defer srv.Close()

	board, err := New(srv.URL).Board(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if board.Name != "desk" || len(board.Columns) != 2 {
		t.Fatalf("bad board: %+v", board)
	}
	if board.Columns[0].WipLimit != nil || *board.Columns[1].WipLimit != 3 {
		t.Errorf("wip_limit decode: %+v", board.Columns)
	}
	if board.Fields[0].Values[1] != "p1" || !board.Fields[0].Required {
		t.Errorf("field decode: %+v", board.Fields[0])
	}
}

func TestTasksPassesFilterAndDecodes(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got := r.URL.Query().Get("q"); got != "foo" {
			t.Errorf("q=%q", got)
		}
		if got := r.URL.Query().Get("column"); got != "review" {
			t.Errorf("column=%q", got)
		}
		reply(w, 200, ok(map[string]any{
			"tasks": []any{map[string]any{
				"id": "T-001", "title": "x", "column": "review", "assignee": "bob",
				"fields": map[string]any{"priority": "p0"},
			}},
			"total": 1,
		}))
	}))
	defer srv.Close()

	list, err := New(srv.URL).Tasks(context.Background(), Filter{Column: "review", Query: "foo"})
	if err != nil {
		t.Fatal(err)
	}
	if list.Total != 1 || list.Tasks[0].ID != "T-001" || *list.Tasks[0].Assignee != "bob" {
		t.Fatalf("bad list: %+v", list)
	}
	if list.Tasks[0].Fields["priority"] != "p0" {
		t.Errorf("fields: %+v", list.Tasks[0].Fields)
	}
}

func TestTaskDecodesHistoryAndNotes(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/tasks/T-001" {
			t.Errorf("path %s", r.URL.Path)
		}
		reply(w, 200, ok(map[string]any{
			"id": "T-001", "title": "x", "column": "backlog", "description": "# hi",
			"created_by": "me", "created_at": "2026-01-01T00:00:00Z", "updated_at": "2026-01-02T00:00:00Z",
			"fields": map[string]any{},
			"notes":  []any{map[string]any{"at": "t", "by": "a", "text": "n"}},
			"history": []any{
				map[string]any{"at": "t", "by": "a", "from": nil, "to": "backlog"},
			},
		}))
	}))
	defer srv.Close()

	task, err := New(srv.URL).Task(context.Background(), "T-001")
	if err != nil {
		t.Fatal(err)
	}
	if task.Description != "# hi" || task.Notes[0].Text != "n" {
		t.Fatalf("bad task: %+v", task)
	}
	if task.History[0].From != nil || task.History[0].To != "backlog" {
		t.Errorf("history: %+v", task.History)
	}
}

func TestMutationsSendOriginAndBody(t *testing.T) {
	var gotBody map[string]any
	var gotPath, gotMethod, gotOrigin string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotPath, gotMethod, gotOrigin = r.URL.Path, r.Method, r.Header.Get("Origin")
		_ = json.NewDecoder(r.Body).Decode(&gotBody)
		reply(w, 200, ok(map[string]any{"id": "T-002", "title": "t", "column": "done", "fields": map[string]any{}}))
	}))
	defer srv.Close()
	c := New(srv.URL)
	ctx := context.Background()

	cases := []struct {
		name   string
		call   func() error
		method string
		path   string
		key    string
		want   any
	}{
		{"create", func() error { _, e := c.Create(ctx, CreateInput{Title: "t"}); return e }, "POST", "/api/tasks", "title", "t"},
		{"update", func() error { _, e := c.Update(ctx, "T-002", UpdateInput{Title: strPtr("n")}); return e }, "PATCH", "/api/tasks/T-002", "title", "n"},
		{"move", func() error { _, e := c.Move(ctx, "T-002", "done", nil); return e }, "POST", "/api/tasks/T-002/move", "to", "done"},
		{"note", func() error { _, e := c.AddNote(ctx, "T-002", "hello"); return e }, "POST", "/api/tasks/T-002/notes", "text", "hello"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			gotBody = nil
			if err := tc.call(); err != nil {
				t.Fatal(err)
			}
			if gotMethod != tc.method || gotPath != tc.path {
				t.Errorf("got %s %s", gotMethod, gotPath)
			}
			if gotOrigin != srv.URL {
				t.Errorf("origin=%q want %q", gotOrigin, srv.URL)
			}
			if gotBody[tc.key] != tc.want {
				t.Errorf("body[%s]=%v want %v", tc.key, gotBody[tc.key], tc.want)
			}
		})
	}
}

func TestErrorEnvelopeBecomesAPIError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		reply(w, 409, map[string]any{"ok": false, "error": map[string]any{
			"code": "TRANSITION_REQUIRES", "message": "нужен assignee", "field": "assignee", "guide": nil, "allowed": nil,
		}})
	}))
	defer srv.Close()

	_, err := New(srv.URL).Move(context.Background(), "T-001", "in_progress", nil)
	var apiErr *APIError
	if !errors.As(err, &apiErr) {
		t.Fatalf("want *APIError, got %T %v", err, err)
	}
	if apiErr.Status != 409 || apiErr.Code != "TRANSITION_REQUIRES" || apiErr.Field != "assignee" {
		t.Errorf("bad error: %+v", apiErr)
	}
}

func TestNonJSONResponseIsError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "boom", 502)
	}))
	defer srv.Close()
	if _, err := New(srv.URL).Board(context.Background()); err == nil {
		t.Fatal("want error")
	}
}

func strPtr(s string) *string { return &s }
