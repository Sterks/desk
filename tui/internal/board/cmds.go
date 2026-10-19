package board

import (
	"context"
	"errors"
	"strconv"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/derunov/desk/tui/internal/api"
)

type loadedMsg struct {
	board api.Board
	tasks []api.TaskItem
}

type detailMsg struct{ task api.Task }

type errMsg struct{ err error }

type eventMsg struct{ event api.Event }

// mutatedMsg — мутация прошла; follow — id карточки, за которой едет фокус.
type mutatedMsg struct {
	text   string
	follow string
}

type moveReq struct {
	id     string
	to     string
	fields map[string]api.FieldValue
}

// moveErrMsg — перенос отклонён; нужен req, чтобы повторить его с недостающим полем.
type moveErrMsg struct {
	req moveReq
	err error
}

func loadCmd(be Backend) tea.Cmd {
	return func() tea.Msg {
		ctx := context.Background()
		b, err := be.Board(ctx)
		if err != nil {
			return errMsg{err}
		}
		l, err := be.Tasks(ctx, api.Filter{})
		if err != nil {
			return errMsg{err}
		}
		return loadedMsg{board: b, tasks: l.Tasks}
	}
}

func detailCmd(be Backend, id string) tea.Cmd {
	return func() tea.Msg {
		t, err := be.Task(context.Background(), id)
		if err != nil {
			return errMsg{err}
		}
		return detailMsg{t}
	}
}

func moveCmd(be Backend, req moveReq) tea.Cmd {
	return func() tea.Msg {
		if _, err := be.Move(context.Background(), req.id, req.to, req.fields); err != nil {
			return moveErrMsg{req: req, err: err}
		}
		return mutatedMsg{text: req.id + " → " + req.to, follow: req.id}
	}
}

func createCmd(be Backend, in api.CreateInput) tea.Cmd {
	return func() tea.Msg {
		t, err := be.Create(context.Background(), in)
		if err != nil {
			return errMsg{err}
		}
		return mutatedMsg{text: "создана " + t.ID, follow: t.ID}
	}
}

func renameCmd(be Backend, id, title string) tea.Cmd {
	return func() tea.Msg {
		if _, err := be.Update(context.Background(), id, api.UpdateInput{Title: &title}); err != nil {
			return errMsg{err}
		}
		return mutatedMsg{text: id + " переименована", follow: id}
	}
}

func noteCmd(be Backend, id, text string) tea.Cmd {
	return func() tea.Msg {
		if _, err := be.AddNote(context.Background(), id, text); err != nil {
			return errMsg{err}
		}
		return mutatedMsg{text: "заметка добавлена к " + id, follow: id}
	}
}

// waitEvent блокируется на канале SSE; nil-канал — команды нет.
func waitEvent(ch <-chan api.Event) tea.Cmd {
	if ch == nil {
		return nil
	}
	return func() tea.Msg {
		e, ok := <-ch
		if !ok {
			return nil
		}
		return eventMsg{e}
	}
}

// coerce приводит введённую строку к типу поля доски.
func coerce(f *api.Field, raw string) (api.FieldValue, error) {
	if f != nil && f.Type == "number" {
		n, err := strconv.ParseFloat(raw, 64)
		if err != nil {
			return nil, errors.New("ожидается число")
		}
		return n, nil
	}
	return raw, nil
}
