package board

import (
	"context"
	"errors"
	"strings"
	"testing"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/derunov/desk/tui/internal/api"
)

type fakeBackend struct {
	board    api.Board
	tasks    []api.TaskItem
	task     api.Task
	moveErr  error
	moves    []moveReq
	created  []api.CreateInput
	renames  map[string]string
	notes    map[string]string
	moveCall int
}

func (f *fakeBackend) Board(context.Context) (api.Board, error) { return f.board, nil }
func (f *fakeBackend) Tasks(context.Context, api.Filter) (api.TaskList, error) {
	return api.TaskList{Tasks: f.tasks, Total: len(f.tasks)}, nil
}
func (f *fakeBackend) Task(context.Context, string) (api.Task, error) { return f.task, nil }
func (f *fakeBackend) Create(_ context.Context, in api.CreateInput) (api.Task, error) {
	f.created = append(f.created, in)
	return api.Task{TaskItem: api.TaskItem{ID: "T-099"}}, nil
}
func (f *fakeBackend) Update(_ context.Context, id string, in api.UpdateInput) (api.Task, error) {
	if f.renames == nil {
		f.renames = map[string]string{}
	}
	f.renames[id] = *in.Title
	return api.Task{}, nil
}
func (f *fakeBackend) Move(_ context.Context, id, to string, fields map[string]api.FieldValue) (api.Task, error) {
	f.moveCall++
	f.moves = append(f.moves, moveReq{id: id, to: to, fields: fields})
	if f.moveErr != nil && f.moveCall == 1 {
		return api.Task{}, f.moveErr
	}
	return api.Task{}, nil
}
func (f *fakeBackend) AddNote(_ context.Context, id, text string) (api.Task, error) {
	if f.notes == nil {
		f.notes = map[string]string{}
	}
	f.notes[id] = text
	return api.Task{}, nil
}

func ptr[T any](v T) *T { return &v }

func newFake() *fakeBackend {
	return &fakeBackend{
		board: api.Board{
			Name: "desk",
			Columns: []api.Column{
				{ID: "backlog", Title: "Backlog", Count: 2},
				{ID: "in_progress", Title: "In progress", Count: 1, WipLimit: ptr(3)},
				{ID: "done", Title: "Done"},
			},
			Fields: []api.Field{{ID: "estimate", Type: "number"}},
		},
		tasks: []api.TaskItem{
			{ID: "T-001", Title: "Первая задача", Column: "backlog", Fields: map[string]api.FieldValue{"priority": "p0"}},
			{ID: "T-002", Title: "Вторая", Column: "backlog", Assignee: ptr("bob")},
			{ID: "T-003", Title: "Третья", Column: "in_progress"},
		},
	}
}

// run выполняет команду и скармливает результат модели (рекурсивно разворачивая batch).
func run(m Model, cmd tea.Cmd) Model {
	if cmd == nil {
		return m
	}
	switch msg := cmd().(type) {
	case nil:
	case tea.BatchMsg:
		for _, c := range msg {
			m = run(m, c)
		}
	default:
		next, c := m.Update(msg)
		m = run(next.(Model), c)
	}
	return m
}

func key(m Model, s string) (Model, tea.Cmd) {
	var msg tea.KeyMsg
	switch s {
	case "enter":
		msg = tea.KeyMsg{Type: tea.KeyEnter}
	case "esc":
		msg = tea.KeyMsg{Type: tea.KeyEsc}
	default:
		msg = tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune(s)}
	}
	next, cmd := m.Update(msg)
	return next.(Model), cmd
}

func typeText(m Model, text string) Model {
	for _, r := range text {
		next, _ := m.Update(tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune{r}})
		m = next.(Model)
	}
	return m
}

func loaded(t *testing.T, be *fakeBackend) Model {
	t.Helper()
	m := New(be, Options{})
	next, _ := m.Update(tea.WindowSizeMsg{Width: 100, Height: 30})
	m = next.(Model)
	return run(m, loadCmd(be))
}

func TestViewRendersColumnsCardsAndWip(t *testing.T) {
	m := loaded(t, newFake())
	view := m.View()
	for _, want := range []string{"Backlog 2", "In progress 1/3", "Done 0", "T-001", "Первая задача", "@bob", "p0"} {
		if !strings.Contains(view, want) {
			t.Errorf("view lacks %q\n%s", want, view)
		}
	}
}

func TestNavigationClampsAtEdges(t *testing.T) {
	m := loaded(t, newFake())
	m, _ = key(m, "h")
	if m.col != 0 {
		t.Errorf("col=%d after h at left edge", m.col)
	}
	m, _ = key(m, "j")
	m, _ = key(m, "j")
	m, _ = key(m, "j")
	if got := m.rows["backlog"]; got != 1 {
		t.Errorf("row=%d want 1 (clamped)", got)
	}
	for i := 0; i < 5; i++ {
		m, _ = key(m, "l")
	}
	if m.col != 2 {
		t.Errorf("col=%d want 2", m.col)
	}
}

func TestMoveRightCallsBackendAndFollowsCard(t *testing.T) {
	be := newFake()
	m := loaded(t, be)
	m, cmd := key(m, "L")
	// после мутации бэкенд вернёт карточку уже в новой колонке
	be.tasks[0].Column = "in_progress"
	m = run(m, cmd)

	if len(be.moves) != 1 || be.moves[0].id != "T-001" || be.moves[0].to != "in_progress" {
		t.Fatalf("moves=%+v", be.moves)
	}
	if m.columnID() != "in_progress" {
		t.Errorf("focus did not follow card: col=%s", m.columnID())
	}
	if sel, _ := m.selected(); sel.ID != "T-001" {
		t.Errorf("selected=%s want T-001", sel.ID)
	}
}

func TestTransitionRequiresOpensPromptAndRetries(t *testing.T) {
	be := newFake()
	be.moveErr = &api.APIError{Status: 409, Code: "TRANSITION_REQUIRES", Message: "нужен estimate", Field: "estimate"}
	m := loaded(t, be)
	m, cmd := key(m, "L")
	m = run(m, cmd)

	if m.mode != modePrompt {
		t.Fatalf("mode=%v want prompt", m.mode)
	}
	m = typeText(m, "5")
	m, cmd = key(m, "enter")
	m = run(m, cmd)

	if len(be.moves) != 2 {
		t.Fatalf("moves=%d want 2", len(be.moves))
	}
	if got := be.moves[1].fields["estimate"]; got != float64(5) {
		t.Errorf("retry fields=%v want estimate=5 (number)", be.moves[1].fields)
	}
}

func TestWipLimitErrorShownInStatus(t *testing.T) {
	be := newFake()
	be.moveErr = &api.APIError{Status: 409, Code: "WIP_LIMIT", Message: "лимит WIP"}
	m := loaded(t, be)
	m, cmd := key(m, "L")
	m = run(m, cmd)

	if m.mode != modeBoard || !m.failed || !strings.Contains(m.status, "лимит WIP") {
		t.Errorf("mode=%v failed=%v status=%q", m.mode, m.failed, m.status)
	}
}

func TestCreateRenameNote(t *testing.T) {
	be := newFake()
	m := loaded(t, be)

	m, _ = key(m, "n")
	m = typeText(m, "Новая")
	m, cmd := key(m, "enter")
	m = run(m, cmd)
	if len(be.created) != 1 || be.created[0].Title != "Новая" || be.created[0].Column != "backlog" {
		t.Errorf("created=%+v", be.created)
	}

	m, _ = key(m, "e")
	m = typeText(m, "!")
	m, cmd = key(m, "enter")
	m = run(m, cmd)
	if got := be.renames["T-001"]; got != "Первая задача!" {
		t.Errorf("rename=%q", got)
	}

	m, _ = key(m, "a")
	m = typeText(m, "ok")
	_, cmd = key(m, "enter")
	run(m, cmd)
	if be.notes["T-001"] != "ok" {
		t.Errorf("notes=%v", be.notes)
	}
}

func TestPromptEscapeCancels(t *testing.T) {
	be := newFake()
	m := loaded(t, be)
	m, _ = key(m, "n")
	m = typeText(m, "x")
	m, cmd := key(m, "esc")
	if m.mode != modeBoard || cmd != nil || len(be.created) != 0 {
		t.Errorf("mode=%v created=%d", m.mode, len(be.created))
	}
}

func TestDetailOpensAndCloses(t *testing.T) {
	be := newFake()
	be.task = api.Task{
		TaskItem:    be.tasks[0],
		CreatedBy:   "me",
		Description: "**важно**",
		Notes:       []api.Note{{At: "t", By: "a", Text: "заметка-текст"}},
		History:     []api.HistoryEntry{{At: "t", By: "a", To: "backlog"}},
	}
	m := loaded(t, be)
	m, cmd := key(m, "enter")
	m = run(m, cmd)

	if m.mode != modeDetail {
		t.Fatalf("mode=%v want detail", m.mode)
	}
	view := m.View()
	for _, want := range []string{"T-001", "заметка-текст", "backlog"} {
		if !strings.Contains(view, want) {
			t.Errorf("detail lacks %q\n%s", want, view)
		}
	}
	m, _ = key(m, "esc")
	if m.mode != modeBoard {
		t.Errorf("mode=%v want board", m.mode)
	}
}

func TestEventTriggersReload(t *testing.T) {
	be := newFake()
	m := loaded(t, be)
	be.tasks = append(be.tasks, api.TaskItem{ID: "T-004", Title: "Из SSE", Column: "backlog"})
	next, cmd := m.Update(eventMsg{api.Event{Type: "task_changed", ID: "T-004"}})
	m = run(next.(Model), cmd)

	if !strings.Contains(m.View(), "Из SSE") {
		t.Errorf("new task missing after event:\n%s", m.View())
	}
}

func TestNarrowTerminalScrollsColumns(t *testing.T) {
	be := newFake()
	m := New(be, Options{})
	next, _ := m.Update(tea.WindowSizeMsg{Width: 30, Height: 20})
	m = run(next.(Model), loadCmd(be))
	m, _ = key(m, "l")
	m, _ = key(m, "l")

	view := m.View()
	if !strings.Contains(view, "Done") || strings.Contains(view, "Backlog") {
		t.Errorf("expected only focused column visible:\n%s", view)
	}
}

func TestLoadErrorShownWithRetryHint(t *testing.T) {
	m := New(newFake(), Options{})
	next, _ := m.Update(errMsg{errors.New("desk api unreachable")})
	view := next.(Model).View()
	if !strings.Contains(view, "unreachable") || !strings.Contains(view, "повторить") {
		t.Errorf("view=%q", view)
	}
}

func TestCoerceNumber(t *testing.T) {
	if _, err := coerce(&api.Field{Type: "number"}, "abc"); err == nil {
		t.Error("want error for non-number")
	}
	if v, _ := coerce(&api.Field{Type: "url"}, "http://x"); v != "http://x" {
		t.Errorf("v=%v", v)
	}
}
