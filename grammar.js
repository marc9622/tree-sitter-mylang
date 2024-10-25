module.exports = grammar({
    name: 'mylang',

    extras: t => [
        /\s/,
        t.line_comment,
        t.block_comment,
    ],

    word: t => t.lower_ident,

    inline: _ => [
    ],

    conflicts: t => [
        [t.switch_line_expr],
        [t.switch_block_expr],
        [t.switch_line_expr, t.switch_block_expr],
    ],

    rules: {
        source_file: t => rep(choice(
            seq(t.value_line_decl, ';'),
            t.value_block_decl,
            t._type_value,
            t.for_decl,
        )),

        // ---------- Comment ----------

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

        // ---------- Lit ----------

        bool_lit: _ => choice(
            'true', 'false',
        ),

        int_lit: _ => choice(
            /\d[\d_]*[uUiI]?/,
            /0b[01_]+[uUiI]?/,
            /0o[0-7_]+[uUiI]?/,
            /0x[\da-fA-F_]+[uUiI]?/,
        ),

        dec_lit: _ =>
            /(\d*(\.\d+([\d_]+\d)?)[fF]?|\d+([\d_]+\d)?[fF])/,

        _num_lit: t => choice(
            t.int_lit,
            t.dec_lit,
        ),

        char_lit: _ => seq(
            "'",
            /./,
            "'",
        ),

        str_lit: _ => seq(
            '"',
            /[^"]*/,
            '"',
        ),

        _lit: t => choice(
            t.bool_lit,
            t._num_lit,
            t.char_lit,
            t.str_lit,
        ),

        // ---------- Ident ----------

        upper_ident: _ =>
            /[A-Z][a-zA-Z@\d]*/,

        lower_ident: _ =>
            /[_a-z@][_a-zA-Z@\d]*/,

        _ident: t => choice(
            t.upper_ident,
            t.lower_ident,
        ),

        alias: t => seq(
            'as', t._value,
        ),

        typed_ident: t => seq(
            t._ident,
            ':', t._type_expr, opt(t.alias),
            opt(':', t._type_expr, opt(t.alias)),
        ),

        // ---------- Value ----------

        null: _ => seq(
            'null',
        ),

        uninit: _ => seq(
            'uninit',
        ),

        struct_type: t => seq(
            'struct', opt(t.upper_ident),
            '{', rep(t.typed_ident, ';'), '}',
        ),

        union_type: t => seq(
            'union', opt(t.upper_ident),
            '{', rep(t._expr, ';'), '}',
        ),

        _type_value: t => choice(
            t.struct_type,
            t.union_type,
        ),

        _value: t => choice(
            t._lit,
            t._ident,
            t.null,
            t.uninit,
            t._type_value,
        ),

        // ---------- Oper ----------

        static_oper: t => seq(
            choice('static', 'constant'),
            choice(
                t._value,
                t.static_oper,
                t._math_oper,
                t.hint_oper,
                t._load_oper,
                t.member_oper,
                t.paren_expr,
                t.call_oper,
                t.compound_oper,
            ),
        ),

        or_oper: t => seq(
            choice(
                t._value,
                t.or_oper,
                t.and_oper,
                t._cmp_oper,
                t._arith_oper,
                t.hint_oper,
                t._load_oper,
                t.member_oper,
                t.paren_expr,
                t.call_oper,
                t.compound_oper,
            ),
            'or',
            choice(
                t._value,
                t.and_oper,
                t.equal_oper,
                t.order_oper,
                t._arith_oper,
                t.hint_oper,
                t._load_oper,
                t.member_oper,
                t.paren_expr,
                t.call_oper,
                t.compound_oper,
            ),
        ),

        and_oper: t => seq(
            choice(
                t._value,
                t.and_oper,
                t.equal_oper,
                t.order_oper,
                t._arith_oper,
                t.hint_oper,
                t._load_oper,
                t.member_oper,
                t.paren_expr,
                t.call_oper,
                t.compound_oper,
            ),
            'and',
            choice(
                t._value,
                t.equal_oper,
                t.order_oper,
                t._arith_oper,
                t.hint_oper,
                t._load_oper,
                t.member_oper,
                t.paren_expr,
                t.call_oper,
                t.compound_oper,
            ),
        ),

        equal_oper: t => seq(
            choice(
                t._value,
                t.equal_oper,
                t.order_oper,
                t._arith_oper,
                t.hint_oper,
                t._load_oper,
                t.member_oper,
                t.paren_expr,
                t.call_oper,
                t.compound_oper,
            ),
            choice('==', '!='),
            choice(
                t._value,
                t.order_oper,
                t._arith_oper,
                t.hint_oper,
                t._load_oper,
                t.member_oper,
                t.paren_expr,
                t.call_oper,
                t.compound_oper,
            ),
        ),

        order_oper: t => seq(
            choice(
                t._value,
                t._arith_oper,
                t.hint_oper,
                t._load_oper,
                t.member_oper,
                t.paren_expr,
                t.call_oper,
                t.compound_oper,
            ),
            choice('<', '<=', '>=', '>'),
            choice(
                t._value,
                t._arith_oper,
                t.hint_oper,
                t._load_oper,
                t.member_oper,
                t.paren_expr,
                t.call_oper,
                t.compound_oper,
            ),
        ),

        _cmp_oper: t => choice(
            t.equal_oper,
            t.order_oper,
        ),

        addsub_oper: t => seq(
            choice(
                t._value,
                t.addsub_oper,
                t.muldiv_oper,
                t.unary_oper,
                t.hint_oper,
                t._load_oper,
                t.member_oper,
                t.paren_expr,
                t.call_oper,
                t.compound_oper,
            ),
            choice('+', '-'),
            choice(
                t._value,
                t.muldiv_oper,
                t.unary_oper,
                t.hint_oper,
                t._load_oper,
                t.member_oper,
                t.paren_expr,
                t.call_oper,
                t.compound_oper,
            ),
        ),

        muldiv_oper: t => seq(
            choice(
                t._value,
                t.muldiv_oper,
                t.unary_oper,
                t.hint_oper,
                t._load_oper,
                t.member_oper,
                t.paren_expr,
                t.call_oper,
                t.compound_oper,
            ),
            choice('*', '/', '%'),
            choice(
                t._value,
                t.unary_oper,
                t.hint_oper,
                t._load_oper,
                t.member_oper,
                t.paren_expr,
                t.call_oper,
                t.compound_oper,
            ),
        ),

        unary_oper: t => seq(
            choice('-', '!', '&'),
            choice(
                t._value,
                t.unary_oper,
                t.hint_oper,
                t._load_oper,
                t.member_oper,
                t.paren_expr,
                t.call_oper,
                t.compound_oper,
            ),
        ),

        _arith_oper: t => choice(
            t.addsub_oper,
            t.muldiv_oper,
            t.unary_oper,
        ),

        _math_oper: t => choice(
            t.or_oper,
            t.and_oper,
            t._cmp_oper,
            t._arith_oper,
        ),

        range_oper: t => seq(
            choice(
                t._value,
                t._math_oper,
                t.hint_oper,
                t._load_oper,
                t.member_oper,
                t.paren_expr,
                t.call_oper,
                t.compound_oper,
            ),
            '..',
            choice(
                t._value,
                t._math_oper,
                t.hint_oper,
                t._load_oper,
                t.member_oper,
                t.paren_expr,
                t.call_oper,
                t.compound_oper,
            ),
        ),

        hint_oper: t => seq(
            choice(
                t._value,
                t.ptr_oper,
                t.arr_oper,
                t._load_oper,
                t.member_oper,
                t.paren_expr,
                t.call_oper,
                t.compound_oper,
            ),
            '::',
            choice(
                t._value,
                t.ptr_oper,
                t.arr_oper,
                t._load_oper,
                t.member_oper,
                t.paren_expr,
                t.call_oper,
                t.compound_oper,
            ),
        ),

        ptr_oper: t => seq(
            '^',
            rep(choice(
                'view',
                'len',
                'own',
                'init',
                'deinit',
            )),
            choice(
                t._value,
                t.ptr_oper,
                t.arr_oper,
                t._load_oper,
                t.member_oper,
                t.paren_expr,
                t.call_oper,
            ),
        ),

        arr_oper: t => seq(
            '[', opt(choice(t._expr, t.typed_ident)), ']',
            choice(
                t._value,
                t.ptr_oper,
                t.arr_oper,
                t._load_oper,
                t.member_oper,
                t.paren_expr,
                t.call_oper,
            ),
        ),

        member_oper: t => seq(
            choice(
                t._value,
                t._load_oper,
                t.member_oper,
                t.paren_expr,
                t.call_oper,
                t.compound_oper,
            ),
            '.',
            choice(
                t._ident,
                t._load_oper,
                t.call_oper,
                t.compound_oper,
            ),
        ),

        index_oper: t => seq(
            choice(
                t._value,
                t._load_oper,
                t.paren_expr,
                t.call_oper,
                t.compound_oper,
            ),
            '[', t._expr, ']',
        ),

        deref_oper: t => seq(
            choice(
                t._value,
                t._load_oper,
                t.paren_expr,
                t.call_oper,
                t.compound_oper,
            ),
            '^',
        ),

        _load_oper: t => choice(
            t.index_oper,
            t.deref_oper,
        ),

        call_oper: t => seq(
            choice(
                field('func_ident', t._ident),
                t._load_oper,
                t.paren_expr,
                t.call_oper,
                t.compound_oper,
            ),
            '(',
            separate(t._expr_or_assign, ','),
            ')',
        ),

        compound_oper: t => seq(
            opt(choice(
                t._ident,
                t._type_value,
                t._load_oper,
                t.paren_expr,
                t.call_oper,
                t.compound_oper,
            )),
            '.{',
            separate(t._expr_or_assign, ','),
            '}',
        ),

        _oper: t => choice(
            t.static_oper,
            t._math_oper,
            t.range_oper,
            t.hint_oper,
            t.ptr_oper,
            t.arr_oper,
            t._load_oper,
            t.member_oper,
        ),

        // ---------- Expr ----------

        control_expr: t => seq(
            choice('return', 'yield', 'break', 'continue'),
            opt(choice(
                t._value,
                t._oper,
                t.paren_expr,
                t.call_oper,
                t.compound_oper,
                t.if_line_expr,
                t.if_block_expr,
                t.switch_line_expr,
                t.switch_block_expr,
                t.for_line_expr,
                t.for_block_expr,
                t.assign_stmt,
            )),
        ),

        paren_expr: t => seq(
            '(', t._expr, ')',
        ),

        _if_rep: t => rep1(prec.right(seq(
            choice(
                seq(':', t._expr_or_assign),
                t.block,
            ),
            'else', 'if', t._expr,
        ))),

        if_line_expr: t => prec.right(seq(
            'if', t._expr,
            opt(t._if_rep),
            choice(
                seq(':', t._expr_or_assign),
                seq(
                    choice(
                        seq(':', t._expr_or_assign),
                        t.block,
                    ),
                    'else', ':', t._expr_or_assign,
                ),
            ),
        )),

        if_block_expr: t => prec.right(seq(
            'if', t._expr,
            opt(t._if_rep),
            choice(
                t.block,
                seq(
                    choice(
                        seq(':', t._expr_or_assign),
                        t.block,
                    ),
                    'else', t.block,
                ),
            ),
        )),

        switch_line_expr: t => prec.right(seq(
            'switch', t._expr,
            rep(choice(
                seq(
                    'case', t._expr, opt(t.alias),
                    choice(
                        seq(':', t._expr_or_assign),
                        t.block,
                    ),
                ),
                seq(
                    'default', opt(t.alias),
                    choice(
                        seq(':', t._expr_or_assign),
                        t.block,
                    ),
                ),
            )),
            choice(
                seq(
                    'case', t._expr, opt(t.alias),
                    ':', t._expr_or_assign,
                ),
                seq(
                    'default', opt(t.alias),
                    ':', t._expr_or_assign,
                ),
            ),
        )),

        switch_block_expr: t => prec.right(seq(
            'switch', t._expr,
            repeat(choice(
                seq(
                    'case', t._expr, opt(t.alias),
                    choice(
                        seq(':', t._expr_or_assign),
                        t.block,
                    ),
                ),
                seq(
                    'default', opt(t.alias),
                    choice(
                        seq(':', t._expr_or_assign),
                        t.block,
                    ),
                ),
            )),
            choice(
                seq(
                    'case', t._expr, opt(t.alias),
                    t.block,
                ),
                seq(
                    'default', opt(t.alias),
                    t.block,
                ),
            ),
        )),

        for_line_expr: t => prec.right(seq(
            'for', opt(t._expr), 'in', t._expr,
            choice(
                seq(':', t._expr_or_assign),
                seq(
                    choice(
                        seq(':', t._expr_or_assign),
                        t.block,
                    ),
                    'else', ':', t._expr_or_assign,
                ),
            ),
        )),

        for_block_expr: t => prec.right(seq(
            'for', opt(t._expr), 'in', t._expr,
            choice(
                t.block,
                seq(
                    choice(
                        seq(':', t._expr_or_assign),
                        t.block,
                    ),
                    'else', t.block,
                ),
            )
        )),

        _expr: t => choice(
            t._value,
            t._oper,
            t.control_expr,
            t.paren_expr,
            t.call_oper,
            t.compound_oper,
            t.if_line_expr,
            t.if_block_expr,
            t.switch_line_expr,
            t.switch_block_expr,
            t.for_line_expr,
            t.for_block_expr,
        ),

        block: t => seq(
            '{',
            rep(choice(
                seq(
                    choice(
                        t.call_oper,
                        t.assign_stmt,
                        t.control_expr,
                        t.value_line_decl,
                        t.if_line_expr,
                        t.switch_line_expr,
                        t.for_line_expr,
                    ),
                    ';',
                ),
                t.value_block_decl,
                t.if_block_expr,
                t.switch_block_expr,
                t.for_block_expr,
            )),
            '}',
        ),

        // ---------- Type Expr ----------

        control_type_expr: t => seq(
            choice('return', 'yield', 'break', 'continue'),
            opt(choice(
                t._value,
                t._oper,
                t.paren_expr,
                t.call_oper,
                t.compound_oper,
                t.if_type_expr,
            )),
        ),

        _if_type_rep: t => rep1(prec.right(seq(
            choice(
                seq(':', t._type_expr),
                t.block,
            ),
            'else', 'if', t._expr,
        ))),

        if_type_expr: t => seq(
            'if', t._expr,
            opt(t._if_type_rep),
            choice(
                seq(':', t._type_expr),
                t.block,
            ),
            'else',
            choice(
                seq(':', t._type_expr),
                t.block,
            ),
        ),

        _type_expr: t => choice(
            t._value,
            t._oper,
            t.control_type_expr,
            t.paren_expr,
            t.call_oper,
            t.compound_oper,
            t.if_type_expr,
        ),

        // ---------- Stmt ----------

        // TODO: Add assignment to other member and index operations
        assign_stmt: t => seq(
            t._ident, '=', t._expr,
        ),

        _expr_or_assign: t => choice(
            t._expr,
            t.assign_stmt,
        ),

        // ---------- Decl ----------

        assign_decl: t => seq(
            choice(
                t._ident,
                t.typed_ident,
                seq(
                    '{',
                    separate(
                        choice(
                            t._ident,
                            t.typed_ident,
                        ),
                        ',',
                    ),
                    '}',
                    opt(':', t._type_expr),
                ),
            ),
            opt('=', t._expr),
        ),

        block_decl: t => seq(
            choice(
                t._ident,
                t.typed_ident,
            ),
            t.block,
        ),

        // TODO: This needs to be split into line and block
        func_decl: t => seq(
            field('func_ident', t._ident),
            '(', separate(t.typed_ident, ','), ')',
            '->',
            choice(
                t._type_expr,
                t.typed_ident,
            ),
            choice(
                t.block,
                seq('=', t.control_expr, ';'),
            ),
        ),

        value_line_decl: t => seq(
            choice('let', 'def'),
            choice(
                t.assign_decl,
            ),
        ),

        value_block_decl: t => seq(
            choice('let', 'def'),
            choice(
                t.block_decl,
                t.func_decl,
            ),
        ),

        for_decl: t => seq(
            'for',
            choice(
                seq(t._expr, opt(t.alias)),
                t.typed_ident,
            ),
            '{',
            rep(choice(
                seq(
                    t.value_line_decl,
                    ';',
                ),
                t.value_block_decl,
                t._type_value,
                t.for_decl,
            )),
            '}',
        ),
    },
});

function opt(...rule) {
    return optional(seq(...rule));
}

function rep(...rule) {
    return repeat(seq(...rule));
}

function rep1(...rule) {
    return repeat1(seq(...rule));
}

function separate(rule, delimiter) {
    return opt(separate1(rule, delimiter));
}

function separate1(rule, delimiter) {
    return seq(
        rule,
        repeat(seq(delimiter, rule)),
        opt(delimiter),
    );
}

// function bi_expr(precedence, operand, operator) {
//     return prec.left(precedence, seq(
//         field('left', operand),
//         operator,
//         field('right', operand),
//     ));
// }
