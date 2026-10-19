package api

import "fmt"

// FieldValue — значение поля карточки: string, float64, bool или []any (после JSON-декода).
type FieldValue = any

type Column struct {
	ID       string  `json:"id"`
	Title    string  `json:"title"`
	Guide    *string `json:"guide"`
	WipLimit *int    `json:"wip_limit"`
	Count    int     `json:"count"`
}

type Field struct {
	ID       string     `json:"id"`
	Type     string     `json:"type"`
	Required bool       `json:"required"`
	Values   []string   `json:"values"`
	Default  FieldValue `json:"default"`
	Min      *float64   `json:"min"`
	Max      *float64   `json:"max"`
	Guide    *string    `json:"guide"`
}

type Transition struct {
	From     string   `json:"from"`
	To       []string `json:"to"`
	Requires []string `json:"requires"`
}

type Board struct {
	Name        string       `json:"name"`
	Guide       *string      `json:"guide"`
	Columns     []Column     `json:"columns"`
	Fields      []Field      `json:"fields"`
	Transitions []Transition `json:"transitions"`
}

type TaskItem struct {
	ID        string                `json:"id"`
	Title     string                `json:"title"`
	Column    string                `json:"column"`
	Assignee  *string               `json:"assignee"`
	Agent     *string               `json:"agent"`
	Fields    map[string]FieldValue `json:"fields"`
	CreatedAt string                `json:"created_at"`
	Invalid   bool                  `json:"invalid"`
	Errors    []string              `json:"errors"`
}

type Note struct {
	At   string `json:"at"`
	By   string `json:"by"`
	Text string `json:"text"`
}

type HistoryEntry struct {
	At   string  `json:"at"`
	By   string  `json:"by"`
	From *string `json:"from"`
	To   string  `json:"to"`
}

type Task struct {
	TaskItem
	CreatedBy   string         `json:"created_by"`
	UpdatedAt   string         `json:"updated_at"`
	Description string         `json:"description"`
	Notes       []Note         `json:"notes"`
	History     []HistoryEntry `json:"history"`
}

type TaskList struct {
	Tasks []TaskItem `json:"tasks"`
	Total int        `json:"total"`
}

type Filter struct {
	Column   string
	Assignee string
	Query    string
}

type CreateInput struct {
	Title       string                `json:"title"`
	Description string                `json:"description,omitempty"`
	Column      string                `json:"column,omitempty"`
	Fields      map[string]FieldValue `json:"fields,omitempty"`
}

type UpdateInput struct {
	Title       *string               `json:"title,omitempty"`
	Description *string               `json:"description,omitempty"`
	Fields      map[string]FieldValue `json:"fields,omitempty"`
}

// APIError — ошибка из конверта {ok:false,error:{...}} или транспортная (Code пуст).
type APIError struct {
	Status  int
	Code    string
	Message string
	Field   string
	Guide   string
	Allowed []any
}

func (e *APIError) Error() string {
	if e.Code == "" {
		return fmt.Sprintf("desk api: HTTP %d: %s", e.Status, e.Message)
	}
	return fmt.Sprintf("desk api: %s: %s", e.Code, e.Message)
}
