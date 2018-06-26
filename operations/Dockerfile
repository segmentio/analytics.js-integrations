FROM circleci/node:4-browsers

RUN sudo apt-get install cmake libhttp-parser-dev openssl

# Libgit2
ADD operations/install-libgit2.sh / 
RUN sudo chmod +x install-libgit2.sh && sudo /install-libgit2.sh

# Operations
ADD bin/* /bin/

