package api

import (
	"bufio"
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"
	"time"
)

func TestParseEventsReadsFramesAndSkipsComments(t *testing.T) {
	stream := ": connected\n\nevent: task_changed\ndata: {\"type\":\"task_changed\",\"id\":\"T-001\"}\n\n: ping\n\nevent: board_changed\ndata: {\"type\":\"board_changed\"}\n\n"
	var got []Event
	err := parseEvents(bufio.NewReader(strings.NewReader(stream)), func(e Event) { got = append(got, e) })
	if err != nil {
		t.Fatal(err)
	}
	want := []Event{{Type: "task_changed", ID: "T-001"}, {Type: "board_changed"}}
	if len(got) != 2 || got[0] != want[0] || got[1] != want[1] {
		t.Fatalf("got %+v want %+v", got, want)
	}
}

func TestSubscribeReconnectsAfterDrop(t *testing.T) {
	var conns atomic.Int32
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/events" {
			t.Errorf("path %s", r.URL.Path)
		}
		n := conns.Add(1)
		w.Header().Set("content-type", "text/event-stream")
		fmt.Fprintf(w, "event: task_changed\ndata: {\"type\":\"task_changed\",\"id\":\"T-%03d\"}\n\n", n)
	}))
	defer srv.Close()

	c := New(srv.URL)
	c.retry = 5 * time.Millisecond
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	out := make(chan Event, 4)
	go c.Subscribe(ctx, out)

	for _, want := range []string{"T-001", "T-002"} {
		select {
		case e := <-out:
			if e.ID != want {
				t.Fatalf("id=%s want %s", e.ID, want)
			}
		case <-ctx.Done():
			t.Fatal("timeout waiting for reconnect")
		}
	}
}

func TestSubscribeStopsOnCancel(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("content-type", "text/event-stream")
		w.(http.Flusher).Flush()
		<-r.Context().Done()
	}))
	defer srv.Close()

	ctx, cancel := context.WithCancel(context.Background())
	done := make(chan struct{})
	go func() { New(srv.URL).Subscribe(ctx, make(chan Event, 1)); close(done) }()
	time.Sleep(30 * time.Millisecond)
	cancel()
	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("Subscribe did not return after cancel")
	}
}
