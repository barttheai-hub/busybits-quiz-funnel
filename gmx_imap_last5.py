#!/usr/bin/env python3
import imaplib
import email
from email.header import decode_header
import os
import re

def dh(x):
    if not x:
        return ""
    parts = decode_header(x)
    out = []
    for s, enc in parts:
        if isinstance(s, bytes):
            out.append(s.decode(enc or "utf-8", errors="replace"))
        else:
            out.append(s)
    return "".join(out)

def text_from_msg(msg):
    # Prefer text/plain; fallback to stripped text/html
    if msg.is_multipart():
        for part in msg.walk():
            ctype = part.get_content_type()
            disp = str(part.get("Content-Disposition") or "")
            if ctype == "text/plain" and "attachment" not in disp.lower():
                payload = part.get_payload(decode=True) or b""
                charset = part.get_content_charset() or "utf-8"
                return payload.decode(charset, errors="replace")
        for part in msg.walk():
            ctype = part.get_content_type()
            disp = str(part.get("Content-Disposition") or "")
            if ctype == "text/html" and "attachment" not in disp.lower():
                payload = part.get_payload(decode=True) or b""
                charset = part.get_content_charset() or "utf-8"
                html = payload.decode(charset, errors="replace")
                # very light strip
                html = re.sub(r"<script[\s\S]*?</script>", "", html, flags=re.I)
                html = re.sub(r"<style[\s\S]*?</style>", "", html, flags=re.I)
                text = re.sub(r"<[^>]+>", " ", html)
                text = re.sub(r"\s+", " ", text)
                return text.strip()
    else:
        ctype = msg.get_content_type()
        payload = msg.get_payload(decode=True) or b""
        charset = msg.get_content_charset() or "utf-8"
        s = payload.decode(charset, errors="replace")
        if ctype == "text/html":
            s = re.sub(r"<[^>]+>", " ", s)
            s = re.sub(r"\s+", " ", s)
        return s.strip()
    return ""


def main():
    user = os.environ.get("GMX_USER")
    pw = os.environ.get("GMX_PASS")
    if not user or not pw:
        raise SystemExit("Set GMX_USER and GMX_PASS env vars.")

    host = os.environ.get("GMX_IMAP_HOST", "imap.gmx.net")
    port = int(os.environ.get("GMX_IMAP_PORT", "993"))

    M = imaplib.IMAP4_SSL(host, port)
    try:
        M.login(user, pw)
        M.select("INBOX")
        typ, data = M.search(None, "ALL")
        if typ != "OK":
            raise RuntimeError(f"search failed: {typ}")
        ids = data[0].split()
        last_ids = ids[-5:]
        # newest last; print newest first
        last_ids = list(reversed(last_ids))

        for i, mid in enumerate(last_ids, 1):
            typ, msg_data = M.fetch(mid, "(RFC822)")
            if typ != "OK":
                print(f"#{i} id={mid.decode()} fetch failed: {typ}")
                continue
            raw = msg_data[0][1]
            msg = email.message_from_bytes(raw)
            subj = dh(msg.get("Subject"))
            frm = dh(msg.get("From"))
            date = dh(msg.get("Date"))
            body = text_from_msg(msg)
            body = body.replace("\r\n", "\n").strip()
            snippet = body[:4000]
            print("="*80)
            print(f"#{i} IMAP_ID: {mid.decode(errors='replace')}")
            print(f"From: {frm}")
            print(f"Date: {date}")
            print(f"Subject: {subj}")
            print("--- BODY (first 4000 chars) ---")
            print(snippet)
            print()
    finally:
        try:
            M.logout()
        except Exception:
            pass

if __name__ == "__main__":
    main()
