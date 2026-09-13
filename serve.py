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


def get_local_ip():
    """Return the IPv4 address used by the active network connection."""
    probe = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        probe.connect(("192.0.2.1", 80))
        return probe.getsockname()[0]
    except OSError:
        return None
    finally:
        probe.close()


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
    local_ip = get_local_ip()
    if local_ip:
        print(f"On your phone, open http://{local_ip}:{args.port}/")
    print("Caching is disabled. Press Ctrl+C to stop the server.")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
