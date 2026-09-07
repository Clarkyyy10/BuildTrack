HOW TO SET THE LOGO (with automatic background removal)

1) Save your mascot image in THIS folder as:
       logo-source.png
   (a .jpg / .jpeg / .webp also works, e.g. logo-source.jpg)

2) From the client folder, run:
       npm run logo

   This removes the white background (edge flood-fill, so white areas INSIDE
   the mascot are kept) and writes the transparent icon used by the app and
   favicon:  client/public/buildtrack-logo.png

3) Refresh the app. For the browser tab icon, hard-refresh (Ctrl+F5).

Notes:
- Until buildtrack-logo.png exists, the app shows a "B" fallback tile.
- If a faint white edge remains, tell me and I'll lower the threshold.
- You can delete this note anytime.
