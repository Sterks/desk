package board

import (
	"fmt"
	"sort"
	"strings"

	"github.com/charmbracelet/bubbles/viewport"
	"github.com/charmbracelet/glamour"
	"github.com/charmbracelet/lipgloss"
	"github.com/derunov/desk/tui/internal/api"
	"github.com/derunov/desk/tui/internal/ui"
)

const hintDetail = "j/k прокрутка · e название · a заметка · esc назад"

func (m Model) openDetail(t api.Task) Model {
	m.detail = t
	m.mode = modeDetail
	vp := viewport.New(max(m.w, 20), max(m.h-2, 3))
	vp.SetContent(m.detailContent(t, vp.Width))
	m.vp = vp
	return m
}

func (m Model) detailView() string {
	footer := ui.MutedText.Render(hintDetail)
	if m.status != "" {
		footer = ui.OKText.Render(truncate(m.status, m.w))
		if m.failed {
			footer = ui.ErrorText.Render(truncate(m.status, m.w))
		}
	}
	title := ui.Header.Render(m.detail.ID + " · " + m.detail.Title)
	return lipgloss.JoinVertical(lipgloss.Left, title, m.vp.View(), footer)
}

func (m Model) detailContent(t api.Task, width int) string {
	var b strings.Builder
	b.WriteString(ui.ColumnTitleOn.Render(t.Column))
	if t.Assignee != nil {
		b.WriteString(ui.MutedText.Render("  @" + *t.Assignee))
	}
	b.WriteString("\n" + fieldsLine(t.Fields) + "\n")
	b.WriteString(ui.MutedText.Render(fmt.Sprintf("создал %s · обновлено %s", t.CreatedBy, t.UpdatedAt)) + "\n\n")
	b.WriteString(m.markdown(t.Description, width))
	if len(t.Notes) > 0 {
		b.WriteString("\n" + ui.ColumnTitle.Render("Заметки") + "\n")
		for _, n := range t.Notes {
			b.WriteString(fmt.Sprintf("%s %s\n  %s\n", ui.MutedText.Render(n.At), n.By, n.Text))
		}
	}
	if len(t.History) > 0 {
		b.WriteString("\n" + ui.ColumnTitle.Render("История") + "\n")
		for _, h := range t.History {
			from := "—"
			if h.From != nil {
				from = *h.From
			}
			b.WriteString(ui.MutedText.Render(h.At) + fmt.Sprintf(" %s: %s → %s\n", h.By, from, h.To))
		}
	}
	return b.String()
}

func fieldsLine(fields map[string]api.FieldValue) string {
	keys := make([]string, 0, len(fields))
	for k := range fields {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	parts := make([]string, 0, len(keys))
	for _, k := range keys {
		parts = append(parts, fmt.Sprintf("%s=%v", k, fields[k]))
	}
	return ui.MutedText.Render(strings.Join(parts, "  "))
}

func (m Model) markdown(src string, width int) string {
	if strings.TrimSpace(src) == "" {
		return ui.MutedText.Render("(без описания)") + "\n"
	}
	style := "light"
	if m.dark {
		style = "dark"
	}
	r, err := glamour.NewTermRenderer(glamour.WithStandardStyle(style), glamour.WithWordWrap(width-2))
	if err != nil {
		return src + "\n"
	}
	out, err := r.Render(src)
	if err != nil {
		return src + "\n"
	}
	return out
}
