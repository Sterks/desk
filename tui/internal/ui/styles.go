// Package ui — палитра и стили lipgloss, общие для экранов TUI.
package ui

import "github.com/charmbracelet/lipgloss"

var (
	Accent  = lipgloss.AdaptiveColor{Light: "#5B4BDB", Dark: "#9D8CFF"}
	Muted   = lipgloss.AdaptiveColor{Light: "#6B7280", Dark: "#8B93A1"}
	Danger  = lipgloss.AdaptiveColor{Light: "#C62828", Dark: "#FF6B6B"}
	Success = lipgloss.AdaptiveColor{Light: "#2E7D32", Dark: "#6FCF97"}
	Warn    = lipgloss.AdaptiveColor{Light: "#B26A00", Dark: "#F2C94C"}
)

var (
	ColumnTitle   = lipgloss.NewStyle().Bold(true)
	ColumnTitleOn = lipgloss.NewStyle().Bold(true).Foreground(Accent)
	MutedText     = lipgloss.NewStyle().Foreground(Muted)
	ErrorText     = lipgloss.NewStyle().Foreground(Danger)
	OKText        = lipgloss.NewStyle().Foreground(Success)
	WarnText      = lipgloss.NewStyle().Foreground(Warn)
	Header        = lipgloss.NewStyle().Bold(true).Padding(0, 1)
	Card          = lipgloss.NewStyle().Border(lipgloss.RoundedBorder()).BorderForeground(Muted).Padding(0, 1)
	CardSelected  = lipgloss.NewStyle().Border(lipgloss.ThickBorder()).BorderForeground(Accent).Padding(0, 1)
)

// Priority красит метку приоритета: p0 — красный, p1 — жёлтый, остальное — приглушённо.
func Priority(p string) lipgloss.Style {
	switch p {
	case "p0":
		return lipgloss.NewStyle().Bold(true).Foreground(Danger)
	case "p1":
		return lipgloss.NewStyle().Bold(true).Foreground(Warn)
	default:
		return lipgloss.NewStyle().Foreground(Muted)
	}
}
