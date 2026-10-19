package api

import (
	"context"
	"errors"
	"os"
	"testing"
	"time"
)

// TestLiveServer гоняет клиент против настоящего `desk ui`. Пропускается без DESK_LIVE_API:
//
//	DESK_LIVE_API=http://127.0.0.1:PORT go test ./internal/api -run Live
func TestLiveServer(t *testing.T) {
	base := os.Getenv("DESK_LIVE_API")
	if base == "" {
		t.Skip("DESK_LIVE_API не задан")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	c := New(base)

	board, err := c.Board(ctx)
	if err != nil || len(board.Columns) < 2 {
		t.Fatalf("board: %v %+v", err, board)
	}

	events := make(chan Event, 8)
	go c.Subscribe(ctx, events)

	created, err := c.Create(ctx, CreateInput{Title: "live smoke", Column: board.Columns[0].ID})
	if err != nil {
		t.Fatalf("create (Origin-guard?): %v", err)
	}
	select {
	case e := <-events:
		if e.Type != "task_changed" {
			t.Errorf("event=%+v", e)
		}
	case <-time.After(3 * time.Second):
		t.Error("SSE-событие не пришло после create")
	}

	if _, err := c.AddNote(ctx, created.ID, "заметка"); err != nil {
		t.Fatalf("note: %v", err)
	}
	if _, err := c.Update(ctx, created.ID, UpdateInput{Title: strPtr("live smoke 2")}); err != nil {
		t.Fatalf("update: %v", err)
	}
	got, err := c.Task(ctx, created.ID)
	if err != nil || got.Title != "live smoke 2" || len(got.Notes) != 1 {
		t.Fatalf("task: %v %+v", err, got)
	}

	// backlog → in_progress без assignee: сервер обязан вернуть TRANSITION_REQUIRES с полем.
	_, err = c.Move(ctx, created.ID, "in_progress", nil)
	var apiErr *APIError
	if !errors.As(err, &apiErr) || apiErr.Code != "TRANSITION_REQUIRES" || apiErr.Field != "assignee" {
		t.Fatalf("want TRANSITION_REQUIRES(assignee), got %v", err)
	}
}
