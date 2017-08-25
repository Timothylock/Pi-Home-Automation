/**
 * The appropriate success function should be called. This creates one unified response structure.
 */
module.exports = {
    Success200: function (res) {
        var result = {};
        result["status"] = "success";
        result["code"] = 0;
        res.send(result)
    }
};
