package info.isaksson.erland.architecturebrowser.platform.service.snapshotsourcefiles;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SnapshotSourceFileSidecarReaderTest {
    @TempDir
    Path tempDir;

    @Test
    void returnsEmptyWhenNoSourceFileSidecarIsDeclared() throws Exception {
        SnapshotSourceFileSidecarReader reader = new SnapshotSourceFileSidecarReader();
        reader.objectMapper = new ObjectMapper();

        assertTrue(reader.readIfPresent(reader.objectMapper.readTree("{\"runMetadata\":{\"metadata\":{}}}")).isEmpty());
    }

    @Test
    void readsDeclaredSourceFileSidecarNextToOutputPath() throws Exception {
        SnapshotSourceFileSidecarReader reader = new SnapshotSourceFileSidecarReader();
        reader.objectMapper = new ObjectMapper();

        Path outputFile = tempDir.resolve("architecture-index.json");
        Files.writeString(outputFile, "{}");
        Path sidecar = tempDir.resolve("architecture-index.json.source-files.json");
        Files.writeString(sidecar, """
            {
              \"contractType\": \"snapshot-source-files/v1\",
              \"files\": [
                {
                  \"relativePath\": \"src/main/java/com/example/Demo.java\",
                  \"language\": \"java\",
                  \"contentType\": \"text/x-java-source\",
                  \"sizeBytes\": 27,
                  \"totalLineCount\": 2,
                  \"textContent\": \"class Demo {}\\n// eof\"
                }
              ],
              \"metadata\": {
                \"referencedFileCount\": 1
              }
            }
            """);
        String payload = """
            {
              \"runMetadata\": {
                \"metadata\": {
                  \"outputPath\": \"%s\",
                  \"workerManifest\": {
                    \"snapshotSourceFilesArtifact\": {
                      \"fileName\": \"architecture-index.json.source-files.json\"
                    }
                  }
                }
              }
            }
            """.formatted(outputFile.toString().replace("\\", "\\\\"));

        SnapshotSourceFileImportArtifact artifact = reader.readIfPresent(reader.objectMapper.readTree(payload)).orElseThrow();
        assertEquals(SnapshotSourceFileSidecarReader.CONTRACT_TYPE, artifact.contractType());
        assertEquals(1, artifact.files().size());
        assertEquals("src/main/java/com/example/Demo.java", artifact.files().getFirst().relativePath());
        assertEquals("java", artifact.files().getFirst().language());
        assertEquals(1, artifact.metadata().get("referencedFileCount"));
    }



    @Test
    void readsDeclaredSourceFileSidecarFromWorkerManifestMetadataShape() throws Exception {
        SnapshotSourceFileSidecarReader reader = new SnapshotSourceFileSidecarReader();
        reader.objectMapper = new ObjectMapper();

        Path outputFile = tempDir.resolve("architecture-index.json");
        Files.writeString(outputFile, "{}");
        Path sidecar = tempDir.resolve("architecture-index.json.source-files.json");
        Files.writeString(sidecar, """
            {
              "contractVersion": "snapshot-source-files/v1",
              "files": [
                {
                  "relativePath": "backend/src/main/java/com/example/Demo.java",
                  "language": "java",
                  "contentType": "text/x-java-source",
                  "sizeBytes": 14,
                  "totalLineCount": 1,
                  "textContent": "class Demo {}"
                }
              ]
            }
            """);
        String payload = """
            {
              "runMetadata": {
                "metadata": {
                  "outputPath": "%s",
                  "workerManifest": {
                    "metadata": {
                      "snapshotSourceFilesArtifact": {
                        "fileName": "architecture-index.json.source-files.json"
                      }
                    }
                  }
                }
              }
            }
            """.formatted(outputFile.toString().replace("\\", "\\\\"));

        SnapshotSourceFileImportArtifact artifact = reader.readIfPresent(reader.objectMapper.readTree(payload)).orElseThrow();
        assertEquals(1, artifact.files().size());
        assertEquals("backend/src/main/java/com/example/Demo.java", artifact.files().getFirst().relativePath());
    }


    @Test
    void readsEmbeddedSourceFilesFromWorkerResponseMetadata() throws Exception {
        SnapshotSourceFileSidecarReader reader = new SnapshotSourceFileSidecarReader();
        reader.objectMapper = new ObjectMapper();

        String payload = """
            {
              "runMetadata": {
                "metadata": {
                  "snapshotSourceFiles": {
                    "contractVersion": "snapshot-source-files/v1",
                    "files": [
                      {
                        "relativePath": "backend/src/main/java/com/example/Demo.java",
                        "language": "java",
                        "contentType": "text/x-java-source",
                        "sizeBytes": 14,
                        "totalLineCount": 1,
                        "textContent": "class Demo {}"
                      }
                    ],
                    "metadata": {
                      "fileCount": 1
                    }
                  }
                }
              }
            }
            """;

        SnapshotSourceFileImportArtifact artifact = reader.readIfPresent(reader.objectMapper.readTree(payload)).orElseThrow();
        assertEquals(SnapshotSourceFileSidecarReader.CONTRACT_TYPE, artifact.contractType());
        assertEquals(1, artifact.files().size());
        assertEquals("backend/src/main/java/com/example/Demo.java", artifact.files().getFirst().relativePath());
        assertEquals(1, artifact.metadata().get("fileCount"));
    }

    @Test
    void rejectsUnsupportedSourceFileSidecarContractType() throws Exception {
        SnapshotSourceFileSidecarReader reader = new SnapshotSourceFileSidecarReader();
        reader.objectMapper = new ObjectMapper();

        Path outputFile = tempDir.resolve("architecture-index.json");
        Files.writeString(outputFile, "{}");
        Path sidecar = tempDir.resolve("architecture-index.json.source-files.json");
        Files.writeString(sidecar, """
            {
              "contractType": "snapshot-source-files/v999",
              "files": []
            }
            """);
        String payload = """
            {
              "runMetadata": {
                "metadata": {
                  "outputPath": "%s",
                  "workerManifest": {
                    "snapshotSourceFilesArtifact": {
                      "fileName": "architecture-index.json.source-files.json"
                    }
                  }
                }
              }
            }
            """.formatted(outputFile.toString().replace("\\", "\\\\"));

        RuntimeException ex = assertThrows(RuntimeException.class,
            () -> reader.readIfPresent(reader.objectMapper.readTree(payload)));
        assertTrue(ex.getMessage().contains("Unsupported snapshot source-file sidecar contractType"));
    }
    @Test
    void rejectsEscapingSidecarPaths() {
        SnapshotSourceFileSidecarReader reader = new SnapshotSourceFileSidecarReader();
        reader.objectMapper = new ObjectMapper();

        Exception ex = assertThrows(RuntimeException.class,
            () -> reader.resolveSidecarPath(tempDir.resolve("architecture-index.json").toString(), "../escape.json"));
        assertFalse(ex.getMessage().isBlank());
    }
}
