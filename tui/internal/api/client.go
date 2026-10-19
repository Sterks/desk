package api

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const requestTimeout = 10 * time.Second

// Client ходит в HTTP API `desk ui`. Origin совпадает с базовым адресом:
// сервер пускает мутации только с такого Origin (src/http/origin-guard.ts).
type Client struct {
	base  string
	http  *http.Client
	retry time.Duration
}

func New(base string) *Client {
	return &Client{base: strings.TrimRight(base, "/"), http: &http.Client{Timeout: requestTimeout}, retry: defaultRetry}
}

type wireError struct {
	Code    string  `json:"code"`
	Message string  `json:"message"`
	Field   *string `json:"field"`
	Guide   *string `json:"guide"`
	Allowed []any   `json:"allowed"`
}

type envelope struct {
	OK    bool            `json:"ok"`
	Data  json.RawMessage `json:"data"`
	Error *wireError      `json:"error"`
}

func (c *Client) do(ctx context.Context, method, path string, query url.Values, in, out any) error {
	target := c.base + path
	if len(query) > 0 {
		target += "?" + query.Encode()
	}
	var body io.Reader
	if in != nil {
		raw, err := json.Marshal(in)
		if err != nil {
			return fmt.Errorf("encode request: %w", err)
		}
		body = bytes.NewReader(raw)
	}
	req, err := http.NewRequestWithContext(ctx, method, target, body)
	if err != nil {
		return fmt.Errorf("build request: %w", err)
	}
	req.Header.Set("Accept", "application/json")
	if in != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	if method != http.MethodGet {
		req.Header.Set("Origin", c.base)
	}
	resp, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("desk api unreachable: %w", err)
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("read response: %w", err)
	}
	var env envelope
	if err := json.Unmarshal(raw, &env); err != nil {
		return &APIError{Status: resp.StatusCode, Message: strings.TrimSpace(string(raw))}
	}
	if !env.OK {
		return toAPIError(resp.StatusCode, env.Error)
	}
	if out == nil {
		return nil
	}
	if err := json.Unmarshal(env.Data, out); err != nil {
		return fmt.Errorf("decode response: %w", err)
	}
	return nil
}

func toAPIError(status int, w *wireError) *APIError {
	if w == nil {
		return &APIError{Status: status, Message: "ответ без поля error"}
	}
	return &APIError{
		Status:  status,
		Code:    w.Code,
		Message: w.Message,
		Field:   deref(w.Field),
		Guide:   deref(w.Guide),
		Allowed: w.Allowed,
	}
}

func deref(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func (c *Client) Board(ctx context.Context) (Board, error) {
	var b Board
	err := c.do(ctx, http.MethodGet, "/api/board", nil, nil, &b)
	return b, err
}

func (c *Client) Tasks(ctx context.Context, f Filter) (TaskList, error) {
	q := url.Values{}
	if f.Column != "" {
		q.Set("column", f.Column)
	}
	if f.Assignee != "" {
		q.Set("assignee", f.Assignee)
	}
	if f.Query != "" {
		q.Set("q", f.Query)
	}
	var l TaskList
	err := c.do(ctx, http.MethodGet, "/api/tasks", q, nil, &l)
	return l, err
}

func (c *Client) Task(ctx context.Context, id string) (Task, error) {
	var t Task
	err := c.do(ctx, http.MethodGet, "/api/tasks/"+url.PathEscape(id), nil, nil, &t)
	return t, err
}

func (c *Client) Create(ctx context.Context, in CreateInput) (Task, error) {
	var t Task
	err := c.do(ctx, http.MethodPost, "/api/tasks", nil, in, &t)
	return t, err
}

func (c *Client) Update(ctx context.Context, id string, in UpdateInput) (Task, error) {
	var t Task
	err := c.do(ctx, http.MethodPatch, "/api/tasks/"+url.PathEscape(id), nil, in, &t)
	return t, err
}

func (c *Client) Move(ctx context.Context, id, to string, fields map[string]FieldValue) (Task, error) {
	payload := map[string]any{"to": to}
	if len(fields) > 0 {
		payload["fields"] = fields
	}
	var t Task
	err := c.do(ctx, http.MethodPost, "/api/tasks/"+url.PathEscape(id)+"/move", nil, payload, &t)
	return t, err
}

func (c *Client) AddNote(ctx context.Context, id, text string) (Task, error) {
	var t Task
	err := c.do(ctx, http.MethodPost, "/api/tasks/"+url.PathEscape(id)+"/notes", nil, map[string]any{"text": text}, &t)
	return t, err
}
