"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComptrollerErrorReporter = exports.CTokenErrorReporter = exports.NoErrorReporter = exports.formatResult = void 0;
const ErrorReporterConstants_1 = require("./ErrorReporterConstants");
class NoErrorReporterType {
    getError(error) {
        return null;
    }
    getInfo(info) {
        return null;
    }
    getDetail(error, detail) {
        return detail.toString();
    }
    getEncodedCustomError(errorName, args) {
        return null;
    }
}
class CTokenErrorReporterType {
    getError(error) {
        if (error === null) {
            return null;
        }
        else {
            return ErrorReporterConstants_1.TokenErr.ErrorInv[Number(error)];
        }
    }
    getInfo(info) {
        if (info === null) {
            return null;
        }
        else {
            return ErrorReporterConstants_1.TokenErr.FailureInfoInv[Number(info)];
        }
    }
    getDetail(error, detail) {
        // Little hack to let us use proper names for cross-contract errors
        if (this.getError(error) === "COMPTROLLER_REJECTION") {
            let comptrollerError = exports.ComptrollerErrorReporter.getError(detail);
            if (comptrollerError) {
                return comptrollerError;
            }
        }
        return detail.toString();
    }
    getEncodedCustomError(errorName, args) {
        try {
            return ErrorReporterConstants_1.TokenErr.CustomErrors.encodeErrorResult(errorName, args);
        }
        catch (err) {
            return null;
        }
    }
}
class ComptrollerErrorReporterType {
    getError(error) {
        if (error === null) {
            return null;
        }
        else {
            // TODO: This probably isn't right...
            return ErrorReporterConstants_1.ComptrollerErr.ErrorInv[Number(error)];
        }
    }
    getInfo(info) {
        if (info === null) {
            return null;
        }
        else {
            // TODO: This probably isn't right...
            return ErrorReporterConstants_1.ComptrollerErr.FailureInfoInv[Number(info)];
        }
    }
    getDetail(error, detail) {
        if (this.getError(error) === "REJECTION") {
            let comptrollerError = exports.ComptrollerErrorReporter.getError(detail);
            if (comptrollerError) {
                return comptrollerError;
            }
        }
        return detail.toString();
    }
    getEncodedCustomError(errorName, args) {
        try {
            return ErrorReporterConstants_1.ComptrollerErr.CustomErrors.encodeErrorResult(errorName, args);
        }
        catch (err) {
            return null;
        }
    }
}
function formatResult(errorReporter, result) {
    const errorStr = errorReporter.getError(result);
    if (errorStr !== null) {
        return `Error=${errorStr}`;
    }
    else {
        return `Result=${result}`;
    }
}
exports.formatResult = formatResult;
// Singleton instances
exports.NoErrorReporter = new NoErrorReporterType();
exports.CTokenErrorReporter = new CTokenErrorReporterType();
exports.ComptrollerErrorReporter = new ComptrollerErrorReporterType();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRXJyb3JSZXBvcnRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9FcnJvclJlcG9ydGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBLHFFQUFrRTtBQVNsRSxNQUFNLG1CQUFtQjtJQUN2QixRQUFRLENBQUMsS0FBVTtRQUNqQixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCxPQUFPLENBQUMsSUFBUztRQUNmLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVELFNBQVMsQ0FBQyxLQUFVLEVBQUUsTUFBYztRQUNsQyxPQUFPLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUMzQixDQUFDO0lBRUQscUJBQXFCLENBQUMsU0FBaUIsRUFBRSxJQUFlO1FBQ3RELE9BQU8sSUFBSSxDQUFBO0lBQ2IsQ0FBQztDQUNGO0FBRUQsTUFBTSx1QkFBdUI7SUFDM0IsUUFBUSxDQUFDLEtBQVU7UUFDakIsSUFBSSxLQUFLLEtBQUssSUFBSSxFQUFFO1lBQ2xCLE9BQU8sSUFBSSxDQUFDO1NBQ2I7YUFBTTtZQUNMLE9BQU8saUNBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7U0FDekM7SUFDSCxDQUFDO0lBRUQsT0FBTyxDQUFDLElBQVM7UUFDZixJQUFJLElBQUksS0FBSyxJQUFJLEVBQUU7WUFDakIsT0FBTyxJQUFJLENBQUM7U0FDYjthQUFNO1lBQ0wsT0FBTyxpQ0FBUSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztTQUM5QztJQUNILENBQUM7SUFFRCxTQUFTLENBQUMsS0FBVSxFQUFFLE1BQWM7UUFDbEMsbUVBQW1FO1FBQ25FLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyx1QkFBdUIsRUFBRTtZQUNwRCxJQUFJLGdCQUFnQixHQUFHLGdDQUF3QixDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUVqRSxJQUFJLGdCQUFnQixFQUFFO2dCQUNwQixPQUFPLGdCQUFnQixDQUFDO2FBQ3pCO1NBQ0Y7UUFFRCxPQUFPLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUMzQixDQUFDO0lBRUQscUJBQXFCLENBQUMsU0FBaUIsRUFBRSxJQUFlO1FBQ3RELElBQUk7WUFDRixPQUFPLGlDQUFRLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQTtTQUNoRTtRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1osT0FBTyxJQUFJLENBQUE7U0FDWjtJQUNILENBQUM7Q0FDRjtBQUVELE1BQU0sNEJBQTRCO0lBQ2hDLFFBQVEsQ0FBQyxLQUFVO1FBQ2pCLElBQUksS0FBSyxLQUFLLElBQUksRUFBRTtZQUNsQixPQUFPLElBQUksQ0FBQztTQUNiO2FBQU07WUFDTCxxQ0FBcUM7WUFDckMsT0FBTyx1Q0FBYyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztTQUMvQztJQUNILENBQUM7SUFFRCxPQUFPLENBQUMsSUFBUztRQUNmLElBQUksSUFBSSxLQUFLLElBQUksRUFBRTtZQUNqQixPQUFPLElBQUksQ0FBQztTQUNiO2FBQU07WUFDTCxxQ0FBcUM7WUFDckMsT0FBTyx1Q0FBYyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztTQUNwRDtJQUNILENBQUM7SUFFRCxTQUFTLENBQUMsS0FBVSxFQUFFLE1BQWM7UUFDbEMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLFdBQVcsRUFBRTtZQUN4QyxJQUFJLGdCQUFnQixHQUFHLGdDQUF3QixDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUVqRSxJQUFJLGdCQUFnQixFQUFFO2dCQUNwQixPQUFPLGdCQUFnQixDQUFDO2FBQ3pCO1NBQ0Y7UUFFRCxPQUFPLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUMzQixDQUFDO0lBRUQscUJBQXFCLENBQUMsU0FBaUIsRUFBRSxJQUFlO1FBQ3RELElBQUk7WUFDRixPQUFPLHVDQUFjLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQTtTQUN0RTtRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1osT0FBTyxJQUFJLENBQUE7U0FDWjtJQUNILENBQUM7Q0FDRjtBQUVELFNBQWdCLFlBQVksQ0FBQyxhQUE0QixFQUFFLE1BQVc7SUFDcEUsTUFBTSxRQUFRLEdBQUcsYUFBYSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNoRCxJQUFJLFFBQVEsS0FBSyxJQUFJLEVBQUU7UUFDckIsT0FBTyxTQUFTLFFBQVEsRUFBRSxDQUFBO0tBQzNCO1NBQU07UUFDTCxPQUFPLFVBQVUsTUFBTSxFQUFFLENBQUM7S0FDM0I7QUFDSCxDQUFDO0FBUEQsb0NBT0M7QUFFRCxzQkFBc0I7QUFDVCxRQUFBLGVBQWUsR0FBRyxJQUFJLG1CQUFtQixFQUFFLENBQUM7QUFDNUMsUUFBQSxtQkFBbUIsR0FBRyxJQUFJLHVCQUF1QixFQUFFLENBQUM7QUFDcEQsUUFBQSx3QkFBd0IsR0FBRyxJQUFJLDRCQUE0QixFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJcbmltcG9ydCB7IHV0aWxzIH0gZnJvbSAnZXRoZXJzJztcbmltcG9ydCB7Q29tcHRyb2xsZXJFcnIsIFRva2VuRXJyfSBmcm9tICcuL0Vycm9yUmVwb3J0ZXJDb25zdGFudHMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEVycm9yUmVwb3J0ZXIge1xuICBnZXRFcnJvcihlcnJvcjogYW55KTogc3RyaW5nIHwgbnVsbFxuICBnZXRJbmZvKGluZm86IGFueSk6IHN0cmluZyB8IG51bGxcbiAgZ2V0RGV0YWlsKGVycm9yOiBhbnksIGRldGFpbDogbnVtYmVyKTogc3RyaW5nXG4gIGdldEVuY29kZWRDdXN0b21FcnJvcihlcnJvck5hbWU6IHN0cmluZywgYXJnczogdW5rbm93bltdKTogc3RyaW5nIHwgbnVsbFxufVxuXG5jbGFzcyBOb0Vycm9yUmVwb3J0ZXJUeXBlIGltcGxlbWVudHMgRXJyb3JSZXBvcnRlciB7XG4gIGdldEVycm9yKGVycm9yOiBhbnkpOiBzdHJpbmcgfCBudWxsIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGdldEluZm8oaW5mbzogYW55KTogc3RyaW5nIHwgbnVsbCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBnZXREZXRhaWwoZXJyb3I6IGFueSwgZGV0YWlsOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIHJldHVybiBkZXRhaWwudG9TdHJpbmcoKTtcbiAgfVxuXG4gIGdldEVuY29kZWRDdXN0b21FcnJvcihlcnJvck5hbWU6IHN0cmluZywgYXJnczogdW5rbm93bltdKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxufVxuXG5jbGFzcyBDVG9rZW5FcnJvclJlcG9ydGVyVHlwZSBpbXBsZW1lbnRzIEVycm9yUmVwb3J0ZXIge1xuICBnZXRFcnJvcihlcnJvcjogYW55KTogc3RyaW5nIHwgbnVsbCB7XG4gICAgaWYgKGVycm9yID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFRva2VuRXJyLkVycm9ySW52W051bWJlcihlcnJvcildO1xuICAgIH1cbiAgfVxuXG4gIGdldEluZm8oaW5mbzogYW55KTogc3RyaW5nIHwgbnVsbCB7XG4gICAgaWYgKGluZm8gPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gVG9rZW5FcnIuRmFpbHVyZUluZm9JbnZbTnVtYmVyKGluZm8pXTtcbiAgICB9XG4gIH1cblxuICBnZXREZXRhaWwoZXJyb3I6IGFueSwgZGV0YWlsOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIC8vIExpdHRsZSBoYWNrIHRvIGxldCB1cyB1c2UgcHJvcGVyIG5hbWVzIGZvciBjcm9zcy1jb250cmFjdCBlcnJvcnNcbiAgICBpZiAodGhpcy5nZXRFcnJvcihlcnJvcikgPT09IFwiQ09NUFRST0xMRVJfUkVKRUNUSU9OXCIpIHtcbiAgICAgIGxldCBjb21wdHJvbGxlckVycm9yID0gQ29tcHRyb2xsZXJFcnJvclJlcG9ydGVyLmdldEVycm9yKGRldGFpbCk7XG5cbiAgICAgIGlmIChjb21wdHJvbGxlckVycm9yKSB7XG4gICAgICAgIHJldHVybiBjb21wdHJvbGxlckVycm9yO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBkZXRhaWwudG9TdHJpbmcoKTtcbiAgfVxuXG4gIGdldEVuY29kZWRDdXN0b21FcnJvcihlcnJvck5hbWU6IHN0cmluZywgYXJnczogdW5rbm93bltdKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBUb2tlbkVyci5DdXN0b21FcnJvcnMuZW5jb2RlRXJyb3JSZXN1bHQoZXJyb3JOYW1lLCBhcmdzKVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG4gIH1cbn1cblxuY2xhc3MgQ29tcHRyb2xsZXJFcnJvclJlcG9ydGVyVHlwZSBpbXBsZW1lbnRzIEVycm9yUmVwb3J0ZXIge1xuICBnZXRFcnJvcihlcnJvcjogYW55KTogc3RyaW5nIHwgbnVsbCB7XG4gICAgaWYgKGVycm9yID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVE9ETzogVGhpcyBwcm9iYWJseSBpc24ndCByaWdodC4uLlxuICAgICAgcmV0dXJuIENvbXB0cm9sbGVyRXJyLkVycm9ySW52W051bWJlcihlcnJvcildO1xuICAgIH1cbiAgfVxuXG4gIGdldEluZm8oaW5mbzogYW55KTogc3RyaW5nIHwgbnVsbCB7XG4gICAgaWYgKGluZm8gPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBUT0RPOiBUaGlzIHByb2JhYmx5IGlzbid0IHJpZ2h0Li4uXG4gICAgICByZXR1cm4gQ29tcHRyb2xsZXJFcnIuRmFpbHVyZUluZm9JbnZbTnVtYmVyKGluZm8pXTtcbiAgICB9XG4gIH1cblxuICBnZXREZXRhaWwoZXJyb3I6IGFueSwgZGV0YWlsOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIGlmICh0aGlzLmdldEVycm9yKGVycm9yKSA9PT0gXCJSRUpFQ1RJT05cIikge1xuICAgICAgbGV0IGNvbXB0cm9sbGVyRXJyb3IgPSBDb21wdHJvbGxlckVycm9yUmVwb3J0ZXIuZ2V0RXJyb3IoZGV0YWlsKTtcblxuICAgICAgaWYgKGNvbXB0cm9sbGVyRXJyb3IpIHtcbiAgICAgICAgcmV0dXJuIGNvbXB0cm9sbGVyRXJyb3I7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGRldGFpbC50b1N0cmluZygpO1xuICB9XG5cbiAgZ2V0RW5jb2RlZEN1c3RvbUVycm9yKGVycm9yTmFtZTogc3RyaW5nLCBhcmdzOiB1bmtub3duW10pOiBzdHJpbmcgfCBudWxsIHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIENvbXB0cm9sbGVyRXJyLkN1c3RvbUVycm9ycy5lbmNvZGVFcnJvclJlc3VsdChlcnJvck5hbWUsIGFyZ3MpXG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICByZXR1cm4gbnVsbFxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0UmVzdWx0KGVycm9yUmVwb3J0ZXI6IEVycm9yUmVwb3J0ZXIsIHJlc3VsdDogYW55KTogc3RyaW5nIHtcbiAgY29uc3QgZXJyb3JTdHIgPSBlcnJvclJlcG9ydGVyLmdldEVycm9yKHJlc3VsdCk7XG4gIGlmIChlcnJvclN0ciAhPT0gbnVsbCkge1xuICAgIHJldHVybiBgRXJyb3I9JHtlcnJvclN0cn1gXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGBSZXN1bHQ9JHtyZXN1bHR9YDtcbiAgfVxufVxuXG4vLyBTaW5nbGV0b24gaW5zdGFuY2VzXG5leHBvcnQgY29uc3QgTm9FcnJvclJlcG9ydGVyID0gbmV3IE5vRXJyb3JSZXBvcnRlclR5cGUoKTtcbmV4cG9ydCBjb25zdCBDVG9rZW5FcnJvclJlcG9ydGVyID0gbmV3IENUb2tlbkVycm9yUmVwb3J0ZXJUeXBlKCk7XG5leHBvcnQgY29uc3QgQ29tcHRyb2xsZXJFcnJvclJlcG9ydGVyID0gbmV3IENvbXB0cm9sbGVyRXJyb3JSZXBvcnRlclR5cGUoKTtcbiJdfQ==