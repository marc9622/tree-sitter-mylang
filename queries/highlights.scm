
(line_comment) @comment
(block_comment) @comment

(int_literal) @number
(dec_literal) @number

(str_literal) @string

(type_id) @type
(value_id) @variable
(member_value member: (value_id) @property)
(macro_id) @macro
(func_call func_id: (value_id) @function.call)
(param_value_decl decl_id: (value_id) @function (func_type))
(func_decl decl_id: (value_id) @function)

[
"+"
"-"
"*"
"/"
"%"
"!"
"&"
"^"
"?"
"::"
"..=" "=.."
"..<" "<.."
"..>" ">.."
"="
"+=" "-="
"*=" "/="
"==" "!="
"<=" ">="
"<" ">" "<>"
"->"
] @operator

[
"sizeof"
"is"
"and"
"or"
"not"
"move"
"copy"
] @keyword.operator

[
"."
":"
","
";"
] @punctuation.delimiter

[
"("
")"
"["
"]"
"{"
"}"
"|"
] @punctuation.bracket

[
"true"
"false"
] @boolean

[
"uninit"
"null"
"void"
void: ["(" ")"]
] @constant.builtin

[
"import"
;"module"
] @include

[
"if"
"else"
"switch"
] @conditional

"return" @keyword.return

; (for_line_expr: "for" @repeat)
; (for_block_expr: "for" @repeat)
; [
; "in"
; "break"
; "continue"
; ] @repeat

"panic" @exception

"pub" @type.qualifier

[
"as"
"alias"
"newtype"
"struct"
"union"
"enum"
"trait"
"impl"
"for"
"where"
"var"
"let"
"def"
"virt"
"extern"
"builtin"
"macro"
"context"
"pure"
"nopanic"
"base"
"async"
"in"
"break"
"continue"
"panic"
"defer"
"do"
] @keyword

