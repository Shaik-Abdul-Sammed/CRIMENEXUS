FROM nginx:alpine

# Copy pre-compiled production React distribution bundle
COPY dist /usr/share/nginx/html

# Copy Nginx configuration with reverse proxy routing to backend
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
