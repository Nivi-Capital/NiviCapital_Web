FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY dist/Nivicapital/browser/ /usr/share/nginx/html/

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
