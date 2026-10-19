package board

import (
	"errors"
	"fmt"

	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/derunov/desk/tui/internal/api"
)

// prompt — однострочный ввод внизу экрана; submit вызывается по Enter с непустым текстом.
type prompt struct {
	label  string
	input  textinput.Model
	submit func(string) tea.Cmd
}

func (m Model) openPrompt(label, initial string, submit func(string) tea.Cmd) Model {
	ti := textinput.New()
	ti.SetValue(initial)
	ti.CursorEnd()
	ti.Focus()
	ti.Prompt = ""
	m.prev = m.mode
	m.mode = modePrompt
	m.prompt = prompt{label: label, input: ti, submit: submit}
	return m
}

func (m Model) updatePrompt(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "esc", "ctrl+c":
		m.mode = m.prev
		return m, nil
	case "enter":
		text := m.prompt.input.Value()
		if text == "" {
			return m, nil
		}
		m.mode = m.prev
		return m, m.prompt.submit(text)
	}
	var cmd tea.Cmd
	m.prompt.input, cmd = m.prompt.input.Update(msg)
	return m, cmd
}

// handleMoveErr: если сервер просит поле (TRANSITION_REQUIRES), спрашиваем его и повторяем перенос.
func (m Model) handleMoveErr(msg moveErrMsg) (tea.Model, tea.Cmd) {
	var apiErr *api.APIError
	if !errors.As(msg.err, &apiErr) || apiErr.Code != "TRANSITION_REQUIRES" || apiErr.Field == "" {
		return m.withStatus(msg.err.Error(), true), nil
	}
	field := apiErr.Field
	label := fmt.Sprintf("%s: нужно поле %s", msg.req.id, field)
	m = m.openPrompt(label, "", func(raw string) tea.Cmd {
		value, err := coerce(m.field(field), raw)
		if err != nil {
			return func() tea.Msg { return errMsg{fmt.Errorf("%s: %w", field, err)} }
		}
		fields := map[string]api.FieldValue{field: value}
		for k, v := range msg.req.fields {
			fields[k] = v
		}
		return moveCmd(m.be, moveReq{id: msg.req.id, to: msg.req.to, fields: fields})
	})
	return m.withStatus(msg.err.Error(), true), nil
}
