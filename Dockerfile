# Simple Nginx-based static server for production
FROM nginx:stable-alpine

# Remove default config and add ours
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy site content
COPY . /usr/share/nginx/html

# Ensure correct permissions
RUN chmod -R 755 /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
