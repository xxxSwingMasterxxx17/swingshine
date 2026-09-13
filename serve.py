#!/usr/bin/env python3
"""Serve the local website on port 8000 without browser caching."""

import argparse
import os
import socket
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
    parser.add_argument(
        "--host",
        default="0.0.0.0",
        help="Interface to listen on (default: all interfaces for phone access)",
    )
    args = parser.parse_args()

    project_directory = Path(__file__).resolve().parent
    os.chdir(project_directory)

    server = ThreadingHTTPServer((args.host, args.port), NoCacheRequestHandler)
    print(f"SwingShine is available at http://localhost:{args.port}/")
    computer_name = socket.gethostname().split(".", 1)[0]
    print(f"On your phone, open http://{computer_name}.local:{args.port}/")
    print("Caching is disabled. Press Ctrl+C to stop the server.")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
