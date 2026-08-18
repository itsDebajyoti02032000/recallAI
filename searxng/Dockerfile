FROM searxng/searxng:latest

COPY settings.yml /etc/searxng/settings.yml

EXPOSE 8080

CMD ["python", "-m", "searx.webapp"]
