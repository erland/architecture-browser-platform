package info.isaksson.erland.architecturebrowser.platform.contract;

import java.util.List;

public final class IndexerImportContract {
    public static final String PLATFORM_IMPORT_VERSION = "2026-04-jpa-normalized-associations-step1";
    public static final List<String> SUPPORTED_SCHEMA_VERSIONS = List.of("1.0.0", "1.3.0", "1.4.0");

    private IndexerImportContract() {
    }
}
