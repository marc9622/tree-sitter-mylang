module.exports = grammar({
    name: 'mylang',

    extras: t => [
        /\s/,
        t.line_comment,
        t.block_comment,
    ],

    rules: {
        source_file: _ => repeat(choice(
        )),

        //#region Comments
        line_comment: _ => token(seq(
            '//',
            /.*/,
        )),

        block_comment: _ => token(seq(
            '/*',
            // TODO: Allow nested block comments
            /[^*]*\*+([^/*][^*]*\*+)*/,
            '/',
        )),
        //#endregion Comments

        //#region Identifiers
        _id: t => choice(
            t.type_id,
            //t.value_id,
        ),

        type_id: _ =>
            /[A-Z][a-zA-Z@\d]*/,

        value_id: _ =>
            /[_a-z@]*[_a-zA-Z@\d]*/,

        macro_id: _ =>
            /#[_a-zA-Z@]*[_a-zA-Z@\d]*/,
        //#endregion Identifiers

    },
})
