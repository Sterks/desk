// desk-tui — терминальная канбан-доска. Ходит в HTTP API, который поднимает `desk tui`.
package main

import (
	"context"
	"flag"
	"fmt"
	"os"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"github.com/derunov/desk/tui/internal/api"
	"github.com/derunov/desk/tui/internal/board"
)

const eventBuffer = 16

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, "desk-tui:", err)
		os.Exit(1)
	}
}

func run() error {
	base := flag.String("api", os.Getenv("DESK_API"), "адрес API desk (или переменная DESK_API)")
	flag.Parse()
	if *base == "" {
		return fmt.Errorf("не задан адрес API: используй --api http://127.0.0.1:PORT или `desk tui`")
	}

	client := api.New(*base)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	events := make(chan api.Event, eventBuffer)
	go client.Subscribe(ctx, events)

	model := board.New(client, board.Options{Events: events, Dark: lipgloss.HasDarkBackground()})
	_, err := tea.NewProgram(model, tea.WithAltScreen()).Run()
	return err
}
