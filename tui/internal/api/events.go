package api

import (
	"bufio"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"time"
)

const defaultRetry = time.Second

// Event — уведомление SSE: task_changed / task_removed (ID задан) или board_changed.
type Event struct {
	Type string `json:"type"`
	ID   string `json:"id"`
}

// Subscribe держит поток /api/events и пересоединяется после обрыва, пока жив ctx.
func (c *Client) Subscribe(ctx context.Context, out chan<- Event) {
	for ctx.Err() == nil {
		_ = c.stream(ctx, out)
		select {
		case <-ctx.Done():
			return
		case <-time.After(c.retry):
		}
	}
}

func (c *Client) stream(ctx context.Context, out chan<- Event) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.base+"/api/events", nil)
	if err != nil {
		return err
	}
	req.Header.Set("Accept", "text/event-stream")
	// Без таймаута: поток долгоживущий, отмена идёт через ctx.
	resp, err := (&http.Client{}).Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	return parseEvents(bufio.NewReader(resp.Body), func(e Event) {
		select {
		case out <- e:
		case <-ctx.Done():
		}
	})
}

func parseEvents(r *bufio.Reader, emit func(Event)) error {
	var data strings.Builder
	for {
		line, err := r.ReadString('\n')
		line = strings.TrimRight(line, "\r\n")
		switch {
		case strings.HasPrefix(line, "data:"):
			data.WriteString(strings.TrimSpace(strings.TrimPrefix(line, "data:")))
		case line == "" && data.Len() > 0:
			var e Event
			if json.Unmarshal([]byte(data.String()), &e) == nil && e.Type != "" {
				emit(e)
			}
			data.Reset()
		}
		if err != nil {
			if err == io.EOF {
				return nil
			}
			return err
		}
	}
}
