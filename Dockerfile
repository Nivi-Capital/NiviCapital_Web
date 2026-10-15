FROM nginx:alpine

COPY dist/nivicapital/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx","-g","daemon off;"]
