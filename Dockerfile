FROM nginx
COPY ./cx-redux-utils/1.0.0 /usr/share/nginx/html
ENV NGINX_PORT 80
EXPOSE 80 443
RUN /bin/bash -c "nginx -g 'daemon off;'"
