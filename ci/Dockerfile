FROM circleci/node:8-browsers

RUN sudo apt-get install cmake libhttp-parser-dev openssl

COPY checkout install-libgit2 bin/ /usr/local/bin/
RUN sudo chmod +x /usr/local/bin/* && \
    cd /tmp && \
    sudo install-libgit2 && \
    sudo rm -rf /tmp/libgit2
