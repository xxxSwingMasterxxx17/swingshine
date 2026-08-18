#!/usr/bin/env python3
"""Serve the local website on port 8000 without browser caching."""

import argparse
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class NoCacheRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header(
            "Cache-Control", "no-store, no-cache, must-revalidate, max-age=0"
        )
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()

    project_directory = Path(__file__).resolve().parent
    os.chdir(project_directory)

    server = ThreadingHTTPServer(("127.0.0.1", args.port), NoCacheRequestHandler)
    print(f"SwingShine is available at http://localhost:{args.port}/")
    print("Caching is disabled. Press Ctrl+C to stop the server.")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
