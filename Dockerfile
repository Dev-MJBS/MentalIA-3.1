# MentalIA 3.1 - App estático servido com Nginx (11 MB)
FROM nginx:alpine

# Copia todos os arquivos do projeto
COPY . /usr/share/nginx/html

# Configuração otimizada para PWA/SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
