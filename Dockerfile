FROM nginx:alpine

# Remove default nginx files
RUN rm -rf /usr/share/nginx/html/*

# Copy Angular production build output
COPY dist/Nivicapital/browser/ /usr/share/nginx/html/

# Container health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
