# Dockerfile para MentalIA 3.1 - App estático com Nginx
FROM nginx:alpine

# Copia arquivos do projeto
COPY . /usr/share/nginx/html

# Config Nginx pra PWA (cache longo + SPA routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Porta padrão
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1