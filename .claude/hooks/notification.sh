#!/bin/bash
# Claude Code stop hook - plays notification sound when response is ready

# Play system sound on macOS
afplay /System/Library/Sounds/Glass.aiff 2>/dev/null || true
