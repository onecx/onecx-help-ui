FROM ghcr.io/onecx/docker-spa-base:v1

# Copy locations config
COPY nginx/locations.conf $DIR_LOCATION/locations.conf
# Copy application build
COPY dist/help-mgmt-ui/ $DIR_HTML

#Optional extend list of application environments
#ENV CONFIG_ENV_LIST BFF_URL,APP_BASE_HREF

# Application environments default values
ENV BFF_URL http://onecx-help-ui:8080/
ENV APP_BASE_HREF /help-mgmt/

RUN chmod 775 -R $DIR_HTML/assets
USER 1001
