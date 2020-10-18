FROM smartcontract/chainlink:latest
WORKDIR /root
ENV HOME /root
RUN apt-get install -y curl
RUN curl https://raw.githubusercontent.com/vishnubob/wait-for-it/ed77b63706ea721766a62ff22d3a251d8b4a6a30/wait-for-it.sh > /bin/wait-for && chmod +x /bin/wait-for
COPY entry.sh /entry.sh
ENTRYPOINT ["bash", "/entry.sh"]
