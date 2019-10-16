FROM circleci/node:10-browsers

RUN sudo apt-get install cmake libhttp-parser-dev openssl inotify-tools

COPY checkout install-libgit2 install-sc bin/ /usr/local/bin/
RUN sudo chmod +x /usr/local/bin/* && \
    cd /tmp && \
    sudo install-libgit2 && \
    sudo install-sc && \
    sudo rm -rf /tmp/libgit2
