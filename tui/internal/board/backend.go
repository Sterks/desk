// Package board — Bubble Tea модель канбан-доски desk.
package board

import (
	"context"

	"github.com/derunov/desk/tui/internal/api"
)

// Backend — то, что модели нужно от API. Реализует *api.Client.
type Backend interface {
	Board(ctx context.Context) (api.Board, error)
	Tasks(ctx context.Context, f api.Filter) (api.TaskList, error)
	Task(ctx context.Context, id string) (api.Task, error)
	Create(ctx context.Context, in api.CreateInput) (api.Task, error)
	Update(ctx context.Context, id string, in api.UpdateInput) (api.Task, error)
	Move(ctx context.Context, id, to string, fields map[string]api.FieldValue) (api.Task, error)
	AddNote(ctx context.Context, id, text string) (api.Task, error)
}
