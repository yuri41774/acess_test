# Dockerfile para servir o site estático de teste de acessibilidade
# Usamos nginx:alpine para imagem leve
FROM nginx:stable-alpine

# Remover configuração default e copiar a nossa
RUN rm -rf /usr/share/nginx/html/*
COPY ./ /usr/share/nginx/html/

# Expor porta 80
EXPOSE 80

# Instrução padrão
CMD ["nginx", "-g", "daemon off;"]
