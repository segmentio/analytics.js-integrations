FROM circleci/node:4-browsers

RUN sudo apt-get install cmake libhttp-parser-dev openssl

COPY operations/ci/checkout /usr/local/bin/
COPY operations/ci/install-libgit2 /usr/local/bin/
COPY bin/* /usr/local/bin/
RUN sudo chmod +x /usr/local/bin/* && \
    cd /tmp && \
    sudo install-libgit2 && \
    sudo rm -rf /tmp/libgit2
