package info.isaksson.erland.architecturebrowser.platform.service.snapshotsourcefiles;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import info.isaksson.erland.architecturebrowser.platform.service.management.ValidationException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@ApplicationScoped
public class SnapshotSourceFileSidecarReader {
    static final String CONTRACT_TYPE = "snapshot-source-files/v1";

    @Inject
    ObjectMapper objectMapper;

    public Optional<SnapshotSourceFileImportArtifact> readIfPresent(JsonNode payload) {
        JsonNode metadata = payload.path("runMetadata").path("metadata");

        JsonNode inlineSourceFiles = metadata.path("snapshotSourceFiles");
        if (inlineSourceFiles.isObject() && !inlineSourceFiles.isEmpty()) {
            return Optional.of(parseArtifact(inlineSourceFiles, "embedded worker response"));
        }

        JsonNode manifest = metadata.path("workerManifest");
        JsonNode sourceFilesArtifact = manifest.path("metadata").path("snapshotSourceFilesArtifact");
        if (sourceFilesArtifact.isMissingNode() || sourceFilesArtifact.isNull()) {
            sourceFilesArtifact = manifest.path("snapshotSourceFilesArtifact");
        }
        String fileName = trimToNull(sourceFilesArtifact.path("fileName").asText(null));
        if (fileName == null) {
            return Optional.empty();
        }

        String outputPath = trimToNull(metadata.path("outputPath").asText(null));
        if (outputPath == null) {
            throw validationError("Indexer manifest referenced snapshot source-file sidecar '%s' but run metadata did not contain outputPath."
                .formatted(fileName));
        }

        Path sidecarPath = resolveSidecarPath(outputPath, fileName);
        if (!Files.isRegularFile(sidecarPath)) {
            throw validationError("Snapshot source-file sidecar was not found at: %s".formatted(sidecarPath));
        }

        try {
            JsonNode root = objectMapper.readTree(Files.readString(sidecarPath));
            return Optional.of(parseArtifact(root, sidecarPath.toString()));
        } catch (IOException e) {
            throw validationError("Failed to read snapshot source-file sidecar '%s': %s".formatted(sidecarPath, e.getMessage()));
        } catch (IllegalArgumentException e) {
            throw validationError("Snapshot source-file sidecar '%s' could not be parsed: %s".formatted(sidecarPath, e.getMessage()));
        }
    }

    private SnapshotSourceFileImportArtifact parseArtifact(JsonNode root, String sourceDescription) {
        String contractType = trimToNull(root.path("contractType").asText(null));
        if (contractType == null) {
            contractType = trimToNull(root.path("contractVersion").asText(null));
        }
        if (!CONTRACT_TYPE.equals(contractType)) {
            throw validationError("Unsupported snapshot source-file sidecar contractType: %s".formatted(contractType));
        }
        List<SnapshotSourceFileImportEntry> files = objectMapper.convertValue(
            root.path("files"),
            new TypeReference<List<SnapshotSourceFileImportEntry>>() {}
        );
        Map<String, Object> metadataMap = root.has("metadata") && root.get("metadata").isObject()
            ? objectMapper.convertValue(root.get("metadata"), new TypeReference<Map<String, Object>>() {})
            : Map.of();
        return new SnapshotSourceFileImportArtifact(CONTRACT_TYPE, files, metadataMap);
    }

    Path resolveSidecarPath(String outputPath, String fileName) {
        Path outputFile = Paths.get(outputPath).toAbsolutePath().normalize();
        Path parent = outputFile.getParent();
        if (parent == null) {
            throw validationError("Unable to resolve sidecar artifact next to outputPath: %s".formatted(outputPath));
        }
        Path fileNamePath = Paths.get(fileName);
        if (fileNamePath.isAbsolute()) {
            throw validationError("Snapshot source-file sidecar fileName must be relative: %s".formatted(fileName));
        }
        for (Path segment : fileNamePath) {
            if ("..".equals(segment.toString())) {
                throw validationError("Snapshot source-file sidecar fileName must not escape the output directory: %s".formatted(fileName));
            }
        }
        Path resolved = parent.resolve(fileNamePath).normalize();
        if (!resolved.startsWith(parent)) {
            throw validationError("Snapshot source-file sidecar path escaped the output directory: %s".formatted(fileName));
        }
        return resolved;
    }

    private static ValidationException validationError(String detail) {
        return new ValidationException(List.of(detail));
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
