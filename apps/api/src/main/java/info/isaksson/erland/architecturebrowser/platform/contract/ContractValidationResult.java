package info.isaksson.erland.architecturebrowser.platform.contract;

import java.util.List;

public record ContractValidationResult(boolean valid, List<String> errors) {
    public static ContractValidationResult ok() {
        return new ContractValidationResult(true, List.of());
    }

    public static ContractValidationResult invalid(List<String> errors) {
        return new ContractValidationResult(false, List.copyOf(errors));
    }
}
