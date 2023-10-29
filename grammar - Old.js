module.exports = grammar({
    name: 'mylang',

    extras: t => [
        /\s/,
        t.line_comment,
        t.block_comment,
    ],

    word: t => t.value_id,

    inline: t => [
        t._id,
    ],

    conflicts: t => [
        // In the case of '[] type .' we could either be accessing
        // a namespaced type or starting a construction expression.
        [t.namespaced_type, t.arr_type],

        // Same with '[] * type .'
        [t.namespaced_type, t.att_type],
        
        // In the case of 'id . id .' we could either be accessing
        // a namespace or a member.
        [t.namespace, t.dot_expr],

        // In the case of '& id . id .' we could either be accessing
        // a namespaced type or a member.
        [t.namespace, t.namespaced_type, t.ref_expr],
        
        // In the case of 'value = () -> Void' we could either be assigning
        // a function type or a lambda expression.
        //[t._expr, t.lambda_expr],
    ],

    rules: {
        source_file: t => repeat(choice(
            t._decl,
            //seq('quack', '[', t._num_literal, ']', t.type_id, ';'), // test
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

        //#region Literals
        _literal: t => choice(
            t.bool_literal,
            t.str_literal,
            t._num_literal,
        ),

        bool_literal: _ => choice(
            'true', 'false',
        ),

        str_literal: _ => seq(
            '"',
            /[^"]*/,
            '"',
        ),

        _num_literal: t => choice(
            t.int_literal,
            t.dec_literal,
        ),

        int_literal: _ => choice(
            /\d[\d_]*[uUiI]?/,
            /0b[01_]+[uUiI]?/,
            /0o[0-7_]+[uUiI]?/,
            /0x[\da-fA-F_]+[uUiI]?/,
        ),

        dec_literal: _ =>
            /(\d*(\.\d+([\d_]+\d)?)[fF]?|\d+([\d_]+\d)?[fF])/,
        //#endregion Literals

        //#region Identifiers
        _id: t => choice(
            t.type_id,
            t.value_id,
        ),

        type_id: _ =>
            /[A-Z][a-zA-Z@\d]*/,

        value_id: _ =>
            /([_a-z@]*|#[_a-zA-Z@]*)[_a-zA-Z@\d]*/,
        //#endregion Identifiers

        //#region Types
        _type: t => choice(
            t.type_id,
            t.namespaced_type,
            t.param_type,
            t.att_type,
            t.arr_type,
            t.func_type,
            t.paren_type,
        ),

        _type_not_namespaced: t => choice(
            t.type_id,
            t.param_type,
            t.att_type_not_namespaced,
            t.arr_type_not_namespaced,
            t.func_type_not_namespaced,
            t.paren_type,
        ),

        namespace: t => seq(
            choice(
                t.value_id,
                t.namespace,
            ),
            '.',
            t.value_id,
        ),

        namespaced_type: t => seq(
            choice(
                t._id,
                t.param_type,
                t.namespace,
                t.namespaced_type,
            ),
            '.',
            choice(
                t.type_id,
                t.param_type,
            ),
        ),

        param_type: t => seq(
            t.type_id,
            '(',
            opt(separate(
                choice(
                    t.param_decl,
                    t._expr,
                ),
                ',',
            )),
            ')',
        ),

        param_decl: t => choice(
            seq(
                t.value_id, ':',
                opt(choice(
                    t._type,
                    '?',
                    seq(
                        opt(choice('*', '&', '^', '?')),
                        choice(t.type_id, t.param_type, '?'), '+',
                        separate(choice(t.type_id, t.param_type, '?'), '+'),
                    ),
                    t.param_type_decl,
                )),
            ),
            t.param_type_decl,
        ),

        param_type_decl: t => seq(
            choice(t.type_id, t.param_type), ':',
            opt(choice(t.type_id, t.param_type, t.att_type)),
            opt('of', separate(choice(t.type_id, t.param_type, '?'), '+')),
        ),

        att_type: t => seq(
            choice('*', '&', '^', '?', /*'!'*/),
            choice(
                t.type_id,
                t.namespaced_type,
                t.param_type,
                t.att_type,
                t.arr_type,
                t.paren_type,
            ),
        ),

        att_type_not_namespaced: t => seq(
            choice('*', '&', '^', '?', /*'!'*/),
            choice(
                t.type_id,
                t.param_type,
                t.att_type_not_namespaced,
                t.arr_type_not_namespaced,
                t.paren_type,
            ),
        ),

        arr_type: t => seq(
            '[',
            opt(choice(
                t._num_literal,
                t.value_id,
                t.sizeof_expr,
                t.negate_expr,
                t.muldiv_expr,
                t.addsub_expr,
                t.cast_expr,
                t.func_call,
                t.paren_expr,
                t.dot_expr,
                t.dot_func_call,
            )),
            ']',
            choice(
                t.type_id,
                t.namespaced_type,
                t.param_type,
                t.att_type,
                t.arr_type,
                t.paren_type,
            ),
        ),

        arr_type_not_namespaced: t => seq(
            '[',
            opt(choice(
                t._num_literal,
                t.value_id,
                t.sizeof_expr,
                t.negate_expr,
                t.muldiv_expr,
                t.addsub_expr,
                t.cast_expr,
                t.func_call,
                t.paren_expr,
                t.dot_expr,
                t.dot_func_call,
            )),
            ']',
            choice(
                t.type_id,
                t.param_type,
                t.att_type_not_namespaced,
                t.arr_type_not_namespaced,
                t.paren_type,
            ),
        ),

        func_type: t => seq(
            opt('[', separate(t.param_decl, ','), ']'),
            '(', opt(separate(t.param_decl, ',')), ')',
            '->', opt(choice(t._type, t.param_type_decl)),
        ),

        func_type_not_namespaced: t => seq(
            '(', opt(separate(t.param_decl, ',')), ')',
            '->', opt(choice(t._type_not_namespaced, t.param_type_decl)),
        ),

        paren_type: t => seq(
            '(', t._type, ')',
        ),

        capture_block: t => seq(
            '|',
            opt(separate(
                seq(choice('*', '&', 'copy', 'move'), t.value_id),
                ','
            )),
            '|',
        ),
        //#endregion Types

        //#region Expressions
        _expr_or_return: t => choice(
            t.return_stmt,
            t.break_stmt,
            'continue',
            t._expr,
        ),

        _cond_expr: t => choice(
            t._literal,
            t.value_id,
            // Allow 'if guards' in if match block.
            //t.if_cond_single_expr,
            //t.if_cond_block_expr,
            //t.if_match_block_expr,
            'uninit',
            t.construct_expr,
            t.sizeof_expr,
            t.negate_expr,
            t.muldiv_expr,
            t.addsub_expr,
            t.comp_expr,
            t.is_expr,
            t.and_expr,
            t.or_expr,
            t.as_expr,
            t.cast_expr,
            t.func_call,
            t.paren_expr,
            t.dot_expr,
            t.dot_func_call,
        ),

        _expr: t => choice(
            t._literal,
            t._id,
            t.namespaced_type,
            t.param_type,
            t.att_type,
            t.arr_type,
            t.func_type,
            t.if_cond_single_expr,
            t.if_cond_block_expr,
            t.if_match_block_expr,
            t.for_single_expr,
            t.for_block_expr,
            t.range_expr,
            'uninit',
            'null',
            t.construct_expr,
            t.ref_expr,
            t.static_expr,
            t.panic_expr,
            t.sizeof_expr,
            t.move_expr,
            t.copy_expr,
            t.negate_expr,
            t.muldiv_expr,
            t.addsub_expr,
            t.comp_expr,
            t.is_expr,
            t.and_expr,
            t.or_expr,
            t.as_expr,
            t.cast_expr,
            t.func_call,
            t.paren_expr,
            t.lambda_expr,
            t.dot_expr,
            t.dot_func_call,
        ),

        if_cond_single_expr: t => prec.right(seq(
            'if', t._cond_expr,
            choice(
                seq(
                    'then', t._expr_or_return,
                    opt('else', 'then', t._expr_or_return),
                ),
                seq(
                    '{', repeat(t._stmt), '}',
                    'else', 'then', t._expr_or_return,
                ),
            ),
        )),

        if_cond_block_expr: t => prec.right(seq(
            'if', t._cond_expr,
            choice(
                seq(
                    'then', t._expr_or_return,
                    'else', '{', repeat(t._stmt), '}',
                ),
                seq(
                    '{', repeat(t._stmt), '}',
                    opt('else', '{', repeat(t._stmt), '}'),
                ),
            ),
        )),

        if_match_block_expr: t => seq(
            'if', '{',
            repeat(seq(
                t._cond_expr,
                choice(
                    seq('then', t._expr_or_return, ';'),
                    seq('{', repeat(t._stmt), '}'),
                ),
            )),
            opt(
                'else',
                choice(
                    seq('then', t._expr_or_return, ';'),
                    seq('{', repeat(t._stmt), '}'),
                ),
            ),
            '}',
        ),

        for_single_expr: t => seq(
            'for',
            opt(t.value_id),
            opt('at', t.value_id),
            opt('range', choice(t.value_id, t.range_expr)),
            opt('in', t.value_id),
            'then', t._expr_or_return,
        ),

        for_block_expr: t => seq(
            'for',
            opt(t.value_id),
            opt('at', t.value_id),
            opt('range', choice(t.value_id, t.range_expr)),
            opt('in', t.value_id),
            '{', repeat(t._stmt), '}',
        ),

        range_expr: t => seq(
            choice(
                t._literal,
                t._id,
                t.cast_expr,
                t.func_call,
                t.paren_expr,
                t.dot_expr,
                t.dot_func_call,
            ),
            choice(
                seq(choice('..=', '..<', '..>')),
                seq(choice('=..', '<..', '>..')),
            ),
            choice(
                t._literal,
                t._id,
                t.cast_expr,
                t.func_call,
                t.paren_expr,
                t.dot_expr,
                t.dot_func_call,
            ),
        ),

        construct_expr: t => seq(
            choice(
                t.type_id,
                t.namespaced_type,
                t.param_type,
                t.arr_type,
            ),
            '.',
            '{', opt(separate(t._expr, ',')), '}',
        ),

        ref_expr: t => seq(
            choice(/*'*',*/ '&', '^'), t.value_id,
        ),

        static_expr: t => seq(
            'static', choice(
                t._literal,
                t.value_id,
                t.if_cond_single_expr,
                t.if_cond_block_expr,
                t.if_match_block_expr,
                t.for_single_expr,
                t.for_block_expr,
                t.range_expr,
                'uninit',
                'null',
                t.construct_expr,
                t.sizeof_expr,
                t.copy_expr,
                t.negate_expr,
                t.muldiv_expr,
                t.addsub_expr,
                t.comp_expr,
                t.is_expr,
                t.and_expr,
                t.or_expr,
                t.as_expr,
                t.cast_expr,
                t.func_call,
                t.paren_expr,
                t.dot_expr,
                t.dot_func_call,
            ),
        ),

        panic_expr: t => seq(
            'panic', choice(
                t.str_literal,
                t.value_id,
                t.func_call,
                t.paren_expr,
                t.dot_expr,
                t.dot_func_call,
            ),
        ),

        sizeof_expr: t => seq(
            'sizeof', choice(
                t.type_id,
                t.namespaced_type,
                t.param_type,
                t.att_type,
                t.arr_type,
                t.paren_type,
            ),
        ),

        move_expr: t => seq(
            'move', choice(
                t._literal,
                t.value_id,
                t.as_expr,
                t.dot_expr,
            ),
        ),

        copy_expr: t => seq(
            'copy', choice(
                t._literal,
                t.value_id,
                t.as_expr,
                t.func_call,
                t.dot_expr,
                t.dot_func_call,
            ),
        ),

        negate_expr: t => seq(
            choice('-', '!'),
            choice(
                t._literal,
                t.value_id,
                'uninit',
                t.cast_expr,
                t.func_call,
                t.paren_expr,
                t.dot_expr,
                t.dot_func_call,
            ),
        ),

        muldiv_expr: t => seq(
            choice(
                t._literal,
                t.value_id,
                'uninit',
                t.construct_expr,
                t.sizeof_expr,
                t.move_expr,
                t.copy_expr,
                t.muldiv_expr,
                t.cast_expr,
                t.func_call,
                t.paren_expr,
                t.dot_expr,
                t.dot_func_call,
            ),
            choice('*', '/', '%'),
            choice(
                t._literal,
                t.value_id,
                'uninit',
                t.construct_expr,
                t.sizeof_expr,
                t.move_expr,
                t.copy_expr,
                t.cast_expr,
                t.func_call,
                t.paren_expr,
                t.dot_expr,
                t.dot_func_call,
            ),
        ),

        addsub_expr: t => seq(
            choice(
                t._literal,
                t.value_id,
                'uninit',
                t.construct_expr,
                t.sizeof_expr,
                t.move_expr,
                t.copy_expr,
                t.addsub_expr,
                t.muldiv_expr,
                t.cast_expr,
                t.func_call,
                t.paren_expr,
                t.dot_expr,
                t.dot_func_call,
            ),
            choice('+', '-'),
            choice(
                t._literal,
                t.value_id,
                'uninit',
                t.construct_expr,
                t.sizeof_expr,
                t.move_expr,
                t.copy_expr,
                t.muldiv_expr,
                t.cast_expr,
                t.func_call,
                t.paren_expr,
                t.dot_expr,
                t.dot_func_call,
            ),
        ),

        comp_expr: t => seq(
            choice(
                t._literal,
                t.value_id,
                'uninit',
                t.construct_expr,
                t.ref_expr,
                t.sizeof_expr,
                t.negate_expr,
                t.muldiv_expr,
                t.addsub_expr,
                t.cast_expr,
                t.func_call,
                t.paren_expr,
                t.dot_expr,
                t.dot_func_call,
            ),
            choice('==', '!=', '<', '>', '<=', '>='),
            choice(
                t._literal,
                t.value_id,
                'uninit',
                t.construct_expr,
                t.ref_expr,
                t.sizeof_expr,
                t.negate_expr,
                t.muldiv_expr,
                t.addsub_expr,
                t.cast_expr,
                t.func_call,
                t.paren_expr,
                t.dot_expr,
                t.dot_func_call,
            ),
        ),

        is_expr: t => seq(
            choice(
                t._literal,
                t.value_id,
                t.construct_expr,
                t.ref_expr,
                t.sizeof_expr,
                t.move_expr,
                t.copy_expr,
                t.negate_expr,
                t.muldiv_expr,
                t.addsub_expr,
                t.as_expr,
                t.cast_expr,
                t.func_call,
                t.paren_expr,
                t.dot_expr,
                t.dot_func_call,
            ),
            'is',
            choice(
                t._type,
                t.pattern,
            ),
        ),

        pattern: t => seq(
            choice(
                t.type_id,
                t.namespaced_type,
                t.param_type,
                t.att_type,
                t.arr_type,
            ),
            '.',
            '{', opt(separate(t.value_id, ',')), '}',
        ),

        and_expr: t => seq(
            choice(
                t._literal,
                t.value_id,
                'uninit',
                t.construct_expr,
                t.ref_expr,
                t.sizeof_expr,
                t.negate_expr,
                t.muldiv_expr,
                t.addsub_expr,
                t.comp_expr,
                t.is_expr,
                t.and_expr,
                t.cast_expr,
                t.func_call,
                t.paren_expr,
                t.dot_expr,
                t.dot_func_call,
            ),
            'and',
            choice(
                t._literal,
                t.value_id,
                'uninit',
                t.construct_expr,
                t.ref_expr,
                t.sizeof_expr,
                t.negate_expr,
                t.muldiv_expr,
                t.addsub_expr,
                t.comp_expr,
                t.is_expr,
                t.cast_expr,
                t.func_call,
                t.paren_expr,
                t.dot_expr,
                t.dot_func_call,
            ),
        ),

        or_expr: t => seq(
            choice(
                t._literal,
                t.value_id,
                'uninit',
                t.construct_expr,
                t.ref_expr,
                t.sizeof_expr,
                t.negate_expr,
                t.muldiv_expr,
                t.addsub_expr,
                t.comp_expr,
                t.is_expr,
                t.and_expr,
                t.or_expr,
                t.cast_expr,
                t.func_call,
                t.paren_expr,
                t.dot_expr,
                t.dot_func_call,
            ),
            'or',
            choice(
                t._literal,
                t.value_id,
                'uninit',
                t.construct_expr,
                t.ref_expr,
                t.sizeof_expr,
                t.negate_expr,
                t.muldiv_expr,
                t.addsub_expr,
                t.comp_expr,
                t.is_expr,
                t.and_expr,
                t.cast_expr,
                t.func_call,
                t.paren_expr,
                t.dot_expr,
                t.dot_func_call,
            ),
        ),

        as_expr: t => seq(
            choice(
                t._literal,
                t.value_id,
                t.namespaced_type,
                t.param_type,
                t.att_type,
                t.arr_type,
                t.func_type,
                t.construct_expr,
                t.cast_expr,
                t.paren_expr,
            ),
            'as',
            choice(
                t.type_id,
                t.param_type,
                t.paren_expr,
            ),
        ),

        cast_expr: t => seq(
            choice(
                t._literal,
                t.value_id,
                'uninit',
                t.construct_expr,
                t.ref_expr,
                t.func_call,
                t.paren_expr,
                t.dot_expr,
                t.dot_func_call,
            ),
            '::',
            choice(
                t.type_id,
                t.param_type,
                t.att_type_not_namespaced,
                t.arr_type_not_namespaced,
                t.paren_type,
            ),
        ),

        func_call: t => seq(
            field('name', t.value_id),
            '(', opt(separate(t._expr, ',')), ')',
        ),

        paren_expr: t => seq(
            '(', t._expr, ')',
        ),

        lambda_expr: t => seq(
            t.func_type,
            opt(t.capture_block),
            choice(
                t.return_stmt,
                seq('{', repeat(t._stmt), '}'),
            ),
        ),

        dot_expr: t => seq(
            choice(
                t._literal,
                t._id,
                t.namespaced_type,
                t.param_type,
                t.arr_type,
                t.construct_expr,
                t.ref_expr,
                t.param_type,
                t.cast_expr,
                t.func_call,
                t.paren_expr,
                t.dot_expr,
                t.dot_func_call,
            ),
            '.', t.value_id,
        ),

        dot_func_call: t => seq(
            choice(
                t._literal,
                t._id,
                t.param_type,
                t.arr_type,
                t.construct_expr,
                t.ref_expr,
                t.param_type,
                t.cast_expr,
                t.func_call,
                t.paren_expr,
                t.dot_expr,
                t.dot_func_call,
            ),
            '.', t.func_call,
        ),
        //#endregion Expressions

        //#region Statements
        _stmt: t => choice(
            t.if_cond_block_expr,
            t.if_match_block_expr,
            t.for_block_expr,
            seq(
                choice(
                    t.if_cond_single_expr,
                    t.for_single_expr,
                    t.assign_stmt,
                    t.func_call,
                    t.dot_func_call,
                    t.return_stmt,
                    t.break_stmt,
                    'continue',
                    t.defer_stmt,
                    t.import_stmt,
                    t.assign_decl,
                    t.block_decl,
                    t.func_decl,
                    t.alias_decl,
                    t.newtype_decl,
                    t.struct_decl,
                    t.enum_decl,
                ),
                ';',
            ),
        ),

        assign_stmt: t => seq(
            choice(
                t.value_id,
                t.ref_expr,
                t.func_call,
                t.paren_expr,
                t.dot_expr,
                t.dot_func_call,
            ),
            choice('=', '+=', '-=', '*=', '/='),
            t._expr,
        ),

        import_stmt: t => seq(
            'import',
            t.import_body,
            ';',
        ),

        import_body: t => seq(
            t.import_namespace,
            opt(choice(
                seq('as', t._id),
                t.with_block,
            )),
        ),

        with_block: t => seq(
            'with',
            choice(
                seq(
                    t.import_namespace,
                    opt('as', t._id),
                ),
                seq(
                    '{',
                    separate(t.import_body, ','),
                    '}',
                ),
            ),
        ),

        import_namespace: t => seq(
            t._id, repeat(seq('.', t._id))
        ),

        return_stmt: t => seq(
            'return', opt(t._expr),
        ),

        break_stmt: t => seq(
            'break', opt(t._expr),
        ),

        defer_stmt: t => seq(
            'defer', choice(
                t.if_cond_single_expr,
                t.if_cond_block_expr,
                t.if_match_block_expr,
                t.for_single_expr,
                t.for_block_expr,
                t.assign_stmt,
                t.panic_expr,
                t.func_call,
                t.paren_expr,
                t.dot_expr,
                t.dot_func_call,
            ),
        ),
        //#endregion Statements

        //#region Declarations
        _decl: t => choice(
            t.import_stmt,
            t.assign_decl,
            t.block_decl,
            t.func_decl,
            t.alias_decl,
            t.newtype_decl,
            t.struct_decl,
            t.union_decl,
            t.enum_decl,
            t.trait_decl,
            t.for_decl,
            t.impl_decl,
        ),

        assign_decl: t => seq(
            opt('pub'),
            choice('var', 'def', 'virt', 'macro', 'extern'),
            opt('pure'),
            choice(
                t._id,
                t.param_decl,
            ),
            opt('=', t._expr,),
            ';',
        ),

        block_decl: t => seq(
            opt('pub'),
            choice('var', 'def', 'virt', 'macro', 'extern'),
            opt('pure'),
            choice(
                t._id,
                t.param_decl,
            ),
            opt(t.capture_block),
            '{',
            repeat(t._stmt),
            '}',
        ),

        func_decl: t => seq(
            opt('pub'),
            choice(
                seq(
                    choice('var', 'def', 'virt', 'extern'),
                    opt('pure'),
                    t.value_id,
                    opt('[', separate(t.param_decl, ','), ']'),
                    '(', opt(separate(t.param_decl, ',')), ')',
                ),
                seq(
                    'macro',
                    opt('pure'),
                    t.value_id,
                    opt('[', separate(t.param_decl, ','), ']'),
                    opt(choice(
                        seq('(', opt(separate(t.param_decl, ',')), ')'),
                        //opt(separate(t.param_decl, ',')), // This actually works, but I don't think I want to allow multiple parameters on macros without parenthesis.
                        t.param_decl,
                    )),
                ),
            ),
            '->',
            opt(choice(
                t.type_id,
                t.namespaced_type,
                t.param_type,
                t.att_type,
                t.arr_type,
            )),
            choice(
                ';',
                seq(
                    opt(t.capture_block),
                    choice(
                        seq(t.return_stmt, ';'),
                        seq('{', repeat(t._stmt), '}'),
                    ),
                ),
            ),
        ),

        alias_decl: t => seq(
            opt('pub'), 'alias', choice(t.type_id, t.param_type),
            '=', t._type, ';',
        ),

        newtype_decl: t => seq(
            opt('pub'), 'newtype', choice(t.type_id, t.param_type),
            '=', t._type, ';',
        ),

        struct_decl: t => seq(
            opt('pub'), 'struct',
            opt(choice(t.type_id, t.param_type), ':'),
            choice(t.type_id, t.param_type),
            opt('for', choice(t.type_id, t.param_type)),
            '{',
            repeat(choice(
                seq(
                    opt('pub'), t.value_id,
                    ':',
                    choice(
                        t._type,
                        t.newtype_decl,
                        t.struct_decl,
                        t.union_decl,
                    ),
                    opt(field('exposed', 'exposed'), opt(t.with_block)),
                    ',',
                ),
                t.assign_decl,
                t.block_decl,
                t.func_decl,
                t.newtype_decl,
                t.struct_decl,
                t.union_decl,
                t.for_decl,
                t.impl_decl,
            )),
            '}',
        ),

        union_decl: t => seq(
            opt('pub'), 'union', choice(t.type_id, t.param_type),
            '{',
            opt(
                separate(
                    choice(
                        t._type,
                        t.newtype_decl,
                        t.struct_decl,
                        t.union_decl,
                    ),
                    ',',
                ),
            ),
            '}',
        ),

        enum_decl: t => seq(
            opt('pub'), 'enum', t.type_id,
            ':', choice(t.type_id, t.param_type),
            '{',
            repeat(choice(
                seq(t.type_id, '=', t._expr, ';'),
                seq(t.type_id, '{', repeat(t._stmt), '}'),
            )),
            '}',
        ),

        trait_decl: t => seq(
            opt('pub'), 'trait',
            opt(choice(t.type_id, t.param_type), ':'),
            choice(t.type_id, t.param_type),
            opt('for', choice(t.type_id, t.param_type, t.param_decl)),
            choice(
                seq(
                    '{',
                    repeat(choice(
                        t.assign_decl,
                        t.block_decl,
                        t.func_decl,
                        t.for_decl,
                        t.impl_decl,
                    )),
                    '}'
                ),
                ';',
            ),
        ),

        for_decl: t => seq(
            'for',
            choice(
                t.type_id,
                t.param_type,
                t.att_type,
                t.paren_type,
                t.param_decl,
            ),
            opt(opt('pub'), 'impl', separate(choice(t.type_id, t.param_type), '+')),
            choice(
                t.assign_decl,
                t.block_decl,
                t.func_decl,
                t.alias_decl,
                t.newtype_decl,
                t.struct_decl,
                t.union_decl,
                t.enum_decl,
                t.trait_decl,
                t.for_decl,
                seq(
                    '{',
                    repeat(choice(
                        t.import_stmt,
                        t.assign_decl,
                        t.block_decl,
                        t.func_decl,
                        t.alias_decl,
                        t.newtype_decl,
                        t.struct_decl,
                        t.union_decl,
                        t.enum_decl,
                        t.trait_decl,
                        t.for_decl,
                        t.impl_decl,
                    )),
                    '}',
                ),
                ';',
            ),
        ),

        impl_decl: t => seq(
            opt('pub'), 'impl', separate(choice(t.type_id, t.param_type), '+'),
            opt(
                'for',
                choice(
                    t.type_id,
                    t.param_type,
                    t.att_type,
                    t.paren_type,
                    t.param_decl,
                ),
            ),
            choice(
                t.assign_decl,
                t.block_decl,
                t.func_decl,
                seq(
                    '{',
                    repeat(choice(
                        t.import_stmt,
                        t.assign_decl,
                        t.block_decl,
                        t.func_decl,
                        t.alias_decl,
                        t.newtype_decl,
                        t.struct_decl,
                        t.union_decl,
                        t.enum_decl,
                        t.trait_decl,
                        t.for_decl,
                        t.impl_decl,
                    )),
                    '}',
                ),
                ';',
            ),
        ),
        //#endregoin Declarations
    },
});

function opt(...rule) {
    return optional(seq(...rule));
}

function separate(rule, delimeter) {
    return seq(
        rule,
        repeat(seq(delimeter, rule)),
        opt(delimeter),
    );
}

function bi_expr(precedence, operand, operator) {
    return prec.left(precedence, seq(
        field('left', operand),
        operator,
        field('right', operand),
    ));
}
