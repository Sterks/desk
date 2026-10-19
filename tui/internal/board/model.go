package board

import (
	"slices"

	"github.com/charmbracelet/bubbles/viewport"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/derunov/desk/tui/internal/api"
)

type mode int

const (
	modeBoard mode = iota
	modeDetail
	modePrompt
)

// Options — внешние зависимости модели, кроме Backend.
type Options struct {
	Events <-chan api.Event // поток SSE; nil — без живого обновления
	Dark   bool             // тема markdown
}

// Model — состояние TUI. Значение, не указатель: Update возвращает копию.
type Model struct {
	be     Backend
	events <-chan api.Event
	dark   bool

	board  api.Board
	tasks  []api.TaskItem
	loaded bool
	col    int
	rows   map[string]int
	follow string

	mode   mode
	prev   mode
	detail api.Task
	vp     viewport.Model
	prompt prompt

	status string
	failed bool
	w, h   int
}

func New(be Backend, opts Options) Model {
	return Model{be: be, events: opts.Events, dark: opts.Dark, rows: map[string]int{}, status: "загрузка…"}
}

func (m Model) Init() tea.Cmd {
	return tea.Batch(loadCmd(m.be), waitEvent(m.events))
}

func (m Model) columnID() string {
	if len(m.board.Columns) == 0 {
		return ""
	}
	return m.board.Columns[m.col].ID
}

func (m Model) columnTasks(id string) []api.TaskItem {
	var out []api.TaskItem
	for _, t := range m.tasks {
		if t.Column == id {
			out = append(out, t)
		}
	}
	return out
}

func (m Model) selected() (api.TaskItem, bool) {
	list := m.columnTasks(m.columnID())
	row := m.rows[m.columnID()]
	if row < 0 || row >= len(list) {
		return api.TaskItem{}, false
	}
	return list[row], true
}

func (m Model) withRow(colID string, row int) Model {
	next := make(map[string]int, len(m.rows)+1)
	for k, v := range m.rows {
		next[k] = v
	}
	next[colID] = row
	m.rows = next
	return m
}

func (m Model) withStatus(text string, failed bool) Model {
	m.status, m.failed = text, failed
	return m
}

func (m Model) field(id string) *api.Field {
	i := slices.IndexFunc(m.board.Fields, func(f api.Field) bool { return f.ID == id })
	if i < 0 {
		return nil
	}
	return &m.board.Fields[i]
}

// applyLoaded подменяет данные и возвращает фокус на карточку m.follow, если она есть.
func (m Model) applyLoaded(msg loadedMsg) Model {
	m.board, m.tasks, m.loaded = msg.board, msg.tasks, true
	if m.col >= len(m.board.Columns) {
		m.col = max(len(m.board.Columns)-1, 0)
	}
	if m.follow != "" {
		m = m.focusTask(m.follow)
		m.follow = ""
	}
	for _, c := range m.board.Columns {
		n := len(m.columnTasks(c.ID))
		m = m.withRow(c.ID, min(m.rows[c.ID], max(n-1, 0)))
	}
	return m
}

func (m Model) focusTask(id string) Model {
	for ci, c := range m.board.Columns {
		for ri, t := range m.columnTasks(c.ID) {
			if t.ID == id {
				m.col = ci
				return m.withRow(c.ID, ri)
			}
		}
	}
	return m
}

func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.w, m.h = msg.Width, msg.Height
		if m.mode == modeDetail {
			m = m.openDetail(m.detail)
		}
		return m, nil
	case loadedMsg:
		m = m.applyLoaded(msg)
		if !m.failed {
			m.status = ""
		}
		return m, nil
	case detailMsg:
		return m.openDetail(msg.task), nil
	case mutatedMsg:
		m.follow = msg.follow
		cmds := []tea.Cmd{loadCmd(m.be)}
		if m.mode == modeDetail {
			cmds = append(cmds, detailCmd(m.be, m.detail.ID))
		}
		return m.withStatus(msg.text, false), tea.Batch(cmds...)
	case eventMsg:
		cmds := []tea.Cmd{loadCmd(m.be), waitEvent(m.events)}
		if m.mode == modeDetail && msg.event.ID == m.detail.ID {
			cmds = append(cmds, detailCmd(m.be, m.detail.ID))
		}
		return m, tea.Batch(cmds...)
	case moveErrMsg:
		return m.handleMoveErr(msg)
	case errMsg:
		return m.withStatus(msg.err.Error(), true), nil
	case tea.KeyMsg:
		return m.handleKey(msg)
	}
	return m, nil
}
