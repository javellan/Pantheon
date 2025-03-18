FROM mcr.microsoft.com/vscode/devcontainers/base:ubuntu-22.04

RUN echo "Rename vscode user to clearlight" \
  && usermod --login clearlight --move-home --home /home/clearlight vscode \
  && groupmod --new-name clearlight vscode \
  && adduser clearlight sudo \
  && mv /etc/sudoers.d/vscode /etc/sudoers.d/clearlight \
  && sed -i 's/vscode/clearlight/g' /etc/sudoers.d/clearlight \
  && cat /etc/sudoers.d/clearlight

# Install yq
COPY --from=mikefarah/yq /usr/bin/yq /usr/bin/yq

COPY .nvmrc /.nvmrc
RUN echo "Install node version from .nvmrc" \
  && export DEBIAN_FRONTEND=noninteractive \
  && apt-get update && apt-get upgrade -yq \
  && apt-get install -yq curl \
  && curl -LsSf https://deb.nodesource.com/setup_$(cat /.nvmrc).x | bash \
  && apt-get install -y nodejs \
  && npm install -g npm \
  && npm install -g yarn eas-cli \
  && rm /.nvmrc

RUN echo "Install android dependnecies" \
  && export DEBIAN_FRONTEND=noninteractive \
  && apt-get update && apt-get upgrade -yq \
  && apt-get install -yq apt-transport-https gpg wget \
  && wget -qO - https://packages.adoptium.net/artifactory/api/gpg/key/public | gpg --dearmor | tee /etc/apt/trusted.gpg.d/adoptium.gpg > /dev/null \
  && echo "deb https://packages.adoptium.net/artifactory/deb $(awk -F= '/^VERSION_CODENAME/{print$2}' /etc/os-release) main" | tee /etc/apt/sources.list.d/adoptium.list \
  && dpkg --add-architecture i386 \
  && apt-get update \
  && apt-get install -yq curl gcc apt-utils software-properties-common bash-completion unzip \
  libxcursor1 libxdamage1 \
  libc6 libncurses5 libstdc++6 libbz2-1.0 libpulse0 \
  libc6:i386 libncurses5:i386 libstdc++6:i386 lib32z1 libbz2-1.0:i386 libpulse0:i386 \
  usbutils \
  temurin-17-jdk \
  && echo "  update jdk path to remove host architecture" \
  && ln -s /usr/lib/jvm/temurin-17-jdk*/ /usr/lib/jvm/temurin-17-jdk

ENV ANDROID_SDK_ROOT=/opt/android-sdk \
  ANDROID_HOME=/opt/android-sdk \
  JAVA_HOME=/usr/lib/jvm/temurin-17-jdk

RUN echo "Setup android" \
  && export DEBIAN_FRONTEND=noninteractive \
  && commandline_tools_url=$(curl -s "https://dl.google.com/android/repository/repository2-1.xml" \
  | yq -p xml -o json \
  | jq '."sdk-repository" | .remotePackage[] | select(."display-name" | startswith("Android SDK Command-line Tools")) | select(."+@path" | endswith(";latest")) | select(.channelRef."+@ref" == "channel-0")' \
  | jq -r '.archives.archive[] | select(."host-os" == "linux") | .complete.url') \
  && echo "  downloading $commandline_tools_url" \
  && wget -q -O commandlinetools.zip https://dl.google.com/android/repository/$commandline_tools_url \
  && unzip -q commandlinetools.zip && rm commandlinetools.zip \
  && mkdir -p /opt/android-sdk/cmdline-tools/ \
  && mv cmdline-tools /opt/android-sdk/cmdline-tools/latest \
  && yes | /opt/android-sdk/cmdline-tools/latest/bin/sdkmanager --licenses \
  && /opt/android-sdk/cmdline-tools/latest/bin/sdkmanager --update \
  && /opt/android-sdk/cmdline-tools/latest/bin/sdkmanager "platform-tools" "platforms;android-30" "system-images;android-30;google_apis;x86_64" "build-tools;30.0.3"
ENV PATH=${PATH}:/opt/android-sdk/emulator:/opt/android-sdk/cmdline-tools/latest/bin:/opt/android-sdk/platform-tools

# NOTE: I wasn't able to get adb connecting to a local device yet, so that's still TODO
