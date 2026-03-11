package info.isaksson.erland.architecturebrowser.platform.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.Map;

@ApplicationScoped
public class JsonSupport {
    @Inject
    ObjectMapper objectMapper;

    public String write(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize JSON", e);
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> asMap(Object value) {
        return objectMapper.convertValue(value, Map.class);
    }
}
