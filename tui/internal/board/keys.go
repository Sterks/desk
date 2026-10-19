package board

import (
	tea "github.com/charmbracelet/bubbletea"
	"github.com/derunov/desk/tui/internal/api"
)

func (m Model) handleKey(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	if msg.String() == "ctrl+c" && m.mode != modePrompt {
		return m, tea.Quit
	}
	switch m.mode {
	case modePrompt:
		return m.updatePrompt(msg)
	case modeDetail:
		return m.detailKey(msg)
	}
	return m.boardKey(msg)
}

func (m Model) boardKey(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	colID := m.columnID()
	row := m.rows[colID]
	switch msg.String() {
	case "q":
		return m, tea.Quit
	case "h", "left":
		m.col = max(m.col-1, 0)
	case "l", "right":
		m.col = min(m.col+1, max(len(m.board.Columns)-1, 0))
	case "j", "down":
		m = m.withRow(colID, min(row+1, max(len(m.columnTasks(colID))-1, 0)))
	case "k", "up":
		m = m.withRow(colID, max(row-1, 0))
	case "g":
		m = m.withRow(colID, 0)
	case "G":
		m = m.withRow(colID, max(len(m.columnTasks(colID))-1, 0))
	case "H":
		return m.moveSelected(-1)
	case "L":
		return m.moveSelected(1)
	case "enter":
		if t, ok := m.selected(); ok {
			return m, detailCmd(m.be, t.ID)
		}
	case "n":
		return m.startCreate(), nil
	case "e":
		if t, ok := m.selected(); ok {
			return m.startRename(t.ID, t.Title), nil
		}
	case "a":
		if t, ok := m.selected(); ok {
			return m.startNote(t.ID), nil
		}
	case "r":
		return m.withStatus("обновление…", false), loadCmd(m.be)
	}
	return m, nil
}

func (m Model) detailKey(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "esc", "q", "backspace":
		m.mode = modeBoard
		return m, nil
	case "e":
		return m.startRename(m.detail.ID, m.detail.Title), nil
	case "a":
		return m.startNote(m.detail.ID), nil
	}
	var cmd tea.Cmd
	m.vp, cmd = m.vp.Update(msg)
	return m, cmd
}

func (m Model) moveSelected(delta int) (tea.Model, tea.Cmd) {
	t, ok := m.selected()
	target := m.col + delta
	if !ok || target < 0 || target >= len(m.board.Columns) {
		return m, nil
	}
	return m, moveCmd(m.be, moveReq{id: t.ID, to: m.board.Columns[target].ID})
}

func (m Model) startCreate() Model {
	colID := m.columnID()
	return m.openPrompt("новая задача в "+colID, "", func(title string) tea.Cmd {
		return createCmd(m.be, api.CreateInput{Title: title, Column: colID})
	})
}

func (m Model) startRename(id, title string) Model {
	return m.openPrompt(id+": название", title, func(next string) tea.Cmd {
		return renameCmd(m.be, id, next)
	})
}

func (m Model) startNote(id string) Model {
	return m.openPrompt(id+": заметка", "", func(text string) tea.Cmd {
		return noteCmd(m.be, id, text)
	})
}
