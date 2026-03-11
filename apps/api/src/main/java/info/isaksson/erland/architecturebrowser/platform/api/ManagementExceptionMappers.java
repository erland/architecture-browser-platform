package info.isaksson.erland.architecturebrowser.platform.api;

import info.isaksson.erland.architecturebrowser.platform.api.dto.ApiErrorResponse;
import info.isaksson.erland.architecturebrowser.platform.service.management.ConflictException;
import info.isaksson.erland.architecturebrowser.platform.service.management.NotFoundException;
import info.isaksson.erland.architecturebrowser.platform.service.management.ValidationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

public final class ManagementExceptionMappers {
    private ManagementExceptionMappers() {
    }

    @Provider
    public static class ValidationExceptionMapper implements ExceptionMapper<ValidationException> {
        @Override
        public Response toResponse(ValidationException exception) {
            return Response.status(Response.Status.BAD_REQUEST)
                .type(MediaType.APPLICATION_JSON)
                .entity(ApiErrorResponse.validation("Validation failed.", exception.errors()))
                .build();
        }
    }

    @Provider
    public static class NotFoundExceptionMapper implements ExceptionMapper<NotFoundException> {
        @Override
        public Response toResponse(NotFoundException exception) {
            return Response.status(Response.Status.NOT_FOUND)
                .type(MediaType.APPLICATION_JSON)
                .entity(ApiErrorResponse.notFound(exception.getMessage()))
                .build();
        }
    }

    @Provider
    public static class ConflictExceptionMapper implements ExceptionMapper<ConflictException> {
        @Override
        public Response toResponse(ConflictException exception) {
            return Response.status(Response.Status.CONFLICT)
                .type(MediaType.APPLICATION_JSON)
                .entity(ApiErrorResponse.conflict(exception.getMessage()))
                .build();
        }
    }
}
