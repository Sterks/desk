package board

import (
	"fmt"
	"strings"

	"github.com/charmbracelet/lipgloss"
	"github.com/charmbracelet/x/ansi"
	"github.com/derunov/desk/tui/internal/api"
	"github.com/derunov/desk/tui/internal/ui"
)

const (
	minColWidth  = 26
	cardChrome   = 4 // рамка (2) + отступы (2)
	maxTitleRows = 2
	hintBoard    = "h/l колонка · j/k карточка · H/L перенос · enter детали · n новая · e название · a заметка · r обновить · q выход"
)

func (m Model) View() string {
	switch {
	case m.mode == modeDetail:
		return m.detailView()
	case !m.loaded:
		return m.loadingView()
	}
	return lipgloss.JoinVertical(lipgloss.Left, m.headerView(), m.columnsView(), m.footerView())
}

func (m Model) loadingView() string {
	if m.failed {
		return ui.ErrorText.Render(m.status) + "\n" + ui.MutedText.Render("r — повторить, q — выход")
	}
	return ui.MutedText.Render(m.status)
}

func (m Model) headerView() string {
	return ui.Header.Render(fmt.Sprintf("%s · %d задач", m.board.Name, len(m.tasks)))
}

func (m Model) footerView() string {
	if m.mode == modePrompt {
		return ui.ColumnTitleOn.Render(m.prompt.label+": ") + m.prompt.input.View()
	}
	switch {
	case m.status == "":
		return ui.MutedText.Render(truncate(hintBoard, m.w))
	case m.failed:
		return ui.ErrorText.Render(truncate(m.status, m.w))
	}
	return ui.OKText.Render(truncate(m.status, m.w))
}

func (m Model) columnsView() string {
	n := len(m.board.Columns)
	if n == 0 {
		return ui.MutedText.Render("на доске нет колонок")
	}
	visible := min(max(m.w/minColWidth, 1), n)
	start := min(max(m.col-visible/2, 0), n-visible)
	width := max(m.w/visible, minColWidth)
	height := max(m.h-3, 4)

	blocks := make([]string, 0, visible)
	for i := start; i < start+visible; i++ {
		blocks = append(blocks, m.columnView(i, width, height))
	}
	return lipgloss.JoinHorizontal(lipgloss.Top, blocks...)
}

func (m Model) columnView(idx, width, height int) string {
	col := m.board.Columns[idx]
	focused := idx == m.col
	title := ui.ColumnTitle
	if focused {
		title = ui.ColumnTitleOn
	}
	head := title.Render(truncate(columnLabel(col), width-1))

	cards := m.columnTasks(col.ID)
	body := cardsView(cards, m.rows[col.ID], focused, width, height-1)
	return lipgloss.NewStyle().Width(width).Height(height).Render(head + "\n" + body)
}

func columnLabel(c api.Column) string {
	if c.WipLimit != nil {
		return fmt.Sprintf("%s %d/%d", c.Title, c.Count, *c.WipLimit)
	}
	return fmt.Sprintf("%s %d", c.Title, c.Count)
}

// cardsView рисует карточки так, чтобы выбранная осталась в окне высотой avail.
func cardsView(cards []api.TaskItem, sel int, focused bool, width, avail int) string {
	rendered := make([]string, len(cards))
	for i, t := range cards {
		rendered[i] = cardView(t, i == sel && focused, width)
	}
	start, used := sel, 0
	for start >= 0 && start < len(rendered) {
		h := lipgloss.Height(rendered[start])
		if used+h > avail && used > 0 {
			break
		}
		used += h
		start--
	}
	start++
	var out []string
	used = 0
	for i := start; i < len(rendered); i++ {
		h := lipgloss.Height(rendered[i])
		if used+h > avail {
			break
		}
		out = append(out, rendered[i])
		used += h
	}
	return strings.Join(out, "\n")
}

func cardView(t api.TaskItem, selected bool, width int) string {
	inner := max(width-cardChrome-2, 8)
	prio, _ := t.Fields["priority"].(string)
	head := t.ID
	if prio != "" {
		head += " " + ui.Priority(prio).Render(prio)
	}
	if t.Invalid {
		head += " " + ui.WarnText.Render("⚠")
	}
	lines := []string{head}
	lines = append(lines, titleLines(t.Title, inner)...)
	if t.Assignee != nil {
		lines = append(lines, ui.MutedText.Render("@"+*t.Assignee))
	}
	style := ui.Card
	if selected {
		style = ui.CardSelected
	}
	return style.Width(width - 2).Render(strings.Join(lines, "\n"))
}

func titleLines(title string, width int) []string {
	wrapped := strings.Split(ansi.Wrap(title, width, ""), "\n")
	if len(wrapped) <= maxTitleRows {
		return wrapped
	}
	last := ansi.Truncate(wrapped[maxTitleRows-1]+" "+wrapped[maxTitleRows], width, "…")
	return append(wrapped[:maxTitleRows-1:maxTitleRows-1], last)
}

func truncate(s string, width int) string {
	if width <= 0 {
		return s
	}
	return ansi.Truncate(s, width, "…")
}
