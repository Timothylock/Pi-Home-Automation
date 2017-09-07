/**
 * The appropriate error function should be called. This creates one unified response structure.
 */
module.exports = {
    Error500: function (code, details, res) {
        var result = {};
        result["status"] = "Internal error";
        result["code"] = code;
        result["details"] = details;
        res.status(500).send(result)
    },

    Error400: function (code, details, res) {
        var result = {};
        result["status"] = "Bad Request";
        result["code"] = code;
        result["details"] = details;
        res.status(400).send(result)
    },

    Error403: function (code, details, res) {
        var result = {};
        result["status"] = "Forbidden";
        result["code"] = code;
        result["details"] = details;
        res.status(403).send(result)
    }
};
