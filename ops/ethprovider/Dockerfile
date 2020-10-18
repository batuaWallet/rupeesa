FROM trufflesuite/ganache-cli:v6.9.1
WORKDIR /root
ENV HOME /root
RUN apk add bash curl
RUN curl https://raw.githubusercontent.com/vishnubob/wait-for-it/ed77b63706ea721766a62ff22d3a251d8b4a6a30/wait-for-it.sh > /bin/wait-for && chmod +x /bin/wait-for
COPY entry.sh /entry.sh
ENTRYPOINT ["bash", "/entry.sh"]
