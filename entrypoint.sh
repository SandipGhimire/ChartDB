#!/bin/sh

: "${API_PROXY_TARGET:=http://server:3001}"
: "${WS_PROXY_TARGET:=http://server:3001}"
: "${STORAGE_MODE:=api}"
export API_PROXY_TARGET WS_PROXY_TARGET STORAGE_MODE

# Replace placeholders in nginx.conf
envsubst '${API_PROXY_TARGET} ${WS_PROXY_TARGET} ${OPENAI_API_KEY} ${OPENAI_API_ENDPOINT} ${LLM_MODEL_NAME} ${HIDE_CHARTDB_CLOUD} ${DISABLE_ANALYTICS} ${STORAGE_MODE}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Start Nginx
nginx -g "daemon off;"
